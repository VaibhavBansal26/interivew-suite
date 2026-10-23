import "dotenv/config";
import dotenv from "dotenv";
import express from "express";
import { createServer as createViteServer } from "vite";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

dotenv.config({ path: path.resolve("../.env.local") });
const app = express();
const port = Number(process.env.PORT || 4173);
const dataDir = path.resolve("data");
const sessionsFile = path.join(dataDir, "sessions.json");
app.use(express.json({ limit: "15mb" }));

const key = () => process.env.OPENAI_API_KEY;
const requireKey = (req, res, next) =>
  key()
    ? next()
    : res.status(503).json({ error: "OPENAI_API_KEY is not configured" });

async function openai(endpoint, body) {
  const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok)
    throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
  return response.json();
}

function outputText(response) {
  if (response.output_text) return response.output_text;
  return (response.output || [])
    .flatMap((item) => item.content || [])
    .filter((part) => part.type === "output_text")
    .map((part) => part.text)
    .join("\n");
}

function instructions({
  round = "phone",
  level = "SDE II",
  language = "Python",
}) {
  const focus =
    round === "phone"
      ? "Run a phone screen with one Leadership Principle question followed by one coding problem. Probe for STAR details and measurable outcomes."
      : round === "dsa"
        ? "Run a data structures and algorithms interview. Ask one problem, wait for clarification, demand an approach before code, probe edge cases, testing, and complexity."
        : round === "debug"
          ? "Run a production debugging interview. Ask the candidate to reproduce the failure, form hypotheses, inspect invariants, make the smallest safe repair, add regression tests, and discuss observability and rollout risk."
          : "Run an HLD or LLD system design interview. Ask for requirements and estimates before architecture, then probe APIs, data model, component boundaries, scaling, failures, security, observability, and trade-offs.";
  return `You are a rigorous Amazon-style ${level} interviewer. ${focus} The candidate uses ${language}. Keep the interview realistic: never reveal solutions, do not praise every answer, interrupt rambling politely, challenge vague claims, and enforce time. Ask one concise question at a time. React to code or screen observations supplied as system context. Do not claim to represent Amazon. Start by briefly introducing the round and asking the first question.`;
}

app.get("/api/health", (req, res) =>
  res.json({ ok: true, keyConfigured: Boolean(key()), python: true }),
);

app.post("/api/realtime", requireKey, async (req, res) => {
  try {
    const { sdp, round, level, language } = req.body;
    if (!sdp) return res.status(400).json({ error: "Missing SDP" });
    const form = new FormData();
    form.set("sdp", sdp);
    form.set(
      "session",
      JSON.stringify({
        type: "realtime",
        model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime",
        instructions: instructions({ round, level, language }),
        output_modalities: ["audio"],
        audio: {
          input: {
            transcription: { model: "gpt-4o-mini-transcribe" },
            turn_detection: {
              type: "semantic_vad",
              eagerness: "medium",
              create_response: true,
              interrupt_response: true,
            },
          },
          output: { voice: "marin" },
        },
      }),
    );
    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}` },
      body: form,
    });
    const text = await response.text();
    if (!response.ok) return res.status(response.status).json({ error: text });
    res.type("application/sdp").send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/analyze-screen", requireKey, async (req, res) => {
  try {
    const {
      image,
      round,
      prompt = "Analyze the candidate's visible work. Identify one concrete observation and one concise interviewer follow-up. Do not solve the problem.",
    } = req.body;
    const response = await openai("responses", {
      model: process.env.OPENAI_VISION_MODEL || "gpt-5",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `${prompt}\nInterview round: ${round}`,
            },
            { type: "input_image", image_url: image, detail: "high" },
          ],
        },
      ],
    });
    res.json({ analysis: outputText(response) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/evaluate", requireKey, async (req, res) => {
  try {
    const {
      round,
      level,
      language,
      transcript = [],
      code = "",
      notes = "",
      durationSeconds = 0,
    } = req.body;
    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        score: { type: "integer", minimum: 0, maximum: 100 },
        signal: {
          type: "string",
          enum: ["Strong positive", "Positive", "Mixed", "Negative"],
        },
        summary: { type: "string" },
        strengths: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              evidence: { type: "string" },
            },
            required: ["title", "evidence"],
          },
        },
        improvements: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              evidence: { type: "string" },
              drill: { type: "string" },
            },
            required: ["title", "evidence", "drill"],
          },
        },
        nextRound: { type: "string" },
      },
      required: [
        "score",
        "signal",
        "summary",
        "strengths",
        "improvements",
        "nextRound",
      ],
    };
    const response = await openai("responses", {
      model: process.env.OPENAI_EVAL_MODEL || "gpt-5",
      input: `Evaluate this ${level} ${round} mock interview. Be strict and cite only supplied evidence. Language: ${language}. Duration: ${durationSeconds}s.\nTranscript:\n${JSON.stringify(transcript)}\nCandidate notes:\n${notes}\nCode/design artifact:\n${code}`,
      text: {
        format: {
          type: "json_schema",
          name: "interview_evaluation",
          strict: true,
          schema,
        },
      },
    });
    const evaluation = JSON.parse(outputText(response));
    await fs.mkdir(dataDir, { recursive: true });
    let sessions = [];
    try {
      sessions = JSON.parse(await fs.readFile(sessionsFile, "utf8"));
    } catch {}
    const record = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      round,
      level,
      language,
      durationSeconds,
      transcript,
      code,
      notes,
      evaluation,
    };
    sessions.unshift(record);
    await fs.writeFile(
      sessionsFile,
      JSON.stringify(sessions.slice(0, 100), null, 2),
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/sessions", async (req, res) => {
  try {
    res.json(JSON.parse(await fs.readFile(sessionsFile, "utf8")));
  } catch {
    res.json([]);
  }
});

function run(cmd, args, cwd, input = "") {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 5000,
    });
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (e) => resolve({ ok: false, stdout, stderr: e.message }));
    child.on("close", (code) =>
      resolve({ ok: code === 0, code, stdout, stderr }),
    );
    child.stdin.end(input);
  });
}

app.post("/api/run-code", async (req, res) => {
  const { language, code, problem = "two-sum" } = req.body;
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "interview-code-"));
  try {
    if (language === "Python") {
      const harness =
        problem === "two-sum"
          ? `\nif __name__ == "__main__":\n s=Solution()\n tests=[(([2,7,11,15],9),[0,1]),(([3,2,4],6),[1,2]),(([3,3],6),[0,1]),(([],5),[])]\n for args, expected in tests:\n  got=s.two_sum(*args)\n  print("PASS" if got==expected else f"FAIL expected={expected} got={got}")\n`
          : `\nif __name__ == "__main__":\n s=Solution()\n tests=[("abcabcbb",3),("bbbbb",1),("pwwkew",3),("",0),("dvdf",3)]\n for value, expected in tests:\n  got=s.length_of_longest_substring(value)\n  print("PASS" if got==expected else f"FAIL expected={expected} got={got}")\n`;
      await fs.writeFile(path.join(dir, "solution.py"), code + harness);
      const result = await run("python3", ["-I", "solution.py"], dir);
      return res.json(result);
    }
    const renamed = code.replace(/public\s+class\s+Solution/, "class Solution");
    const harness =
      problem === "two-sum"
        ? `\nclass Main { public static void main(String[] args) { Solution s=new Solution(); int[][] nums={{2,7,11,15},{3,2,4},{3,3}}; int[] targets={9,6,6}; int[][] expected={{0,1},{1,2},{0,1}}; for(int i=0;i<nums.length;i++){ int[] got=s.twoSum(nums[i],targets[i]); System.out.println(java.util.Arrays.equals(got,expected[i])?"PASS":"FAIL expected="+java.util.Arrays.toString(expected[i])+" got="+java.util.Arrays.toString(got)); } } }`
        : `\nclass Main { public static void main(String[] args) { Solution s=new Solution(); String[] values={"abcabcbb","bbbbb","pwwkew","","dvdf"}; int[] expected={3,1,3,0,3}; for(int i=0;i<values.length;i++){ int got=s.lengthOfLongestSubstring(values[i]); System.out.println(got==expected[i]?"PASS":"FAIL expected="+expected[i]+" got="+got); } } }`;
    await fs.writeFile(
      path.join(dir, "Main.java"),
      "import java.util.*;\n" + renamed + harness,
    );
    const compile = await run("javac", ["Main.java"], dir);
    if (!compile.ok) return res.json(compile);
    return res.json(await run("java", ["-Xmx64m", "Main"], dir));
  } finally {
    fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
});

if (process.env.NODE_ENV === "production") {
  const clientDir = path.resolve("dist/client");
  app.use(express.static(clientDir));
  app.use((req, res, next) =>
    req.method === "GET" && req.accepts("html")
      ? res.sendFile(path.join(clientDir, "index.html"))
      : next(),
  );
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
app.listen(port, "0.0.0.0", () =>
  console.log(`Interview Suite running at http://localhost:${port}`),
);
