import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BracketsCurly,
  Broadcast,
  Check,
  CheckCircle,
  Clock,
  Code,
  Desktop,
  FileText,
  Gear,
  Graph,
  Lock,
  Microphone,
  MicrophoneSlash,
  MonitorArrowUp,
  Play,
  Plus,
  ShieldCheck,
  Sparkle,
  Stop,
  TrendUp,
  UserCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { useInterviewEngine } from "./useInterviewEngine";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const rounds = [
  {
    id: "phone",
    name: "Phone Screen",
    sub: "Leadership Principles discussion and coding",
    mins: 50,
    skills: [
      "Leadership Principles",
      "Communication",
      "Problem Solving",
      "Coding",
    ],
  },
  {
    id: "dsa",
    name: "Data Structures and Algorithms",
    sub: "Focused coding room",
    mins: 55,
    skills: [
      "Algorithms",
      "Data Structures",
      "Problem Solving",
      "Code Quality",
    ],
  },
  {
    id: "design",
    name: "System Design",
    sub: "LLD or HLD collaborative whiteboard",
    mins: 55,
    skills: ["System Design", "Scalability", "Trade-offs", "Communication"],
  },
  {
    id: "debug",
    name: "Debugging",
    sub: "Diagnose, repair, and explain production code",
    mins: 45,
    skills: ["Debugging", "Testing", "Code Reading", "Communication"],
  },
];
const py = `class Solution:\n    def two_sum(self, nums, target):\n        seen = {}\n        for i, n in enumerate(nums):\n            complement = target - n\n            if complement in seen:\n                return [seen[complement], i]\n            seen[n] = i\n        return []`;
const java = `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (seen.containsKey(complement))\n                return new int[] { seen.get(complement), i };\n            seen.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}`;
const dsaPy = `class Solution:\n    def length_of_longest_substring(self, s):\n        last_seen = {}\n        left = 0\n        best = 0\n        for right, char in enumerate(s):\n            if char in last_seen and last_seen[char] >= left:\n                left = last_seen[char] + 1\n            last_seen[char] = right\n            best = max(best, right - left + 1)\n        return best`;
const dsaJava = `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        Map<Character, Integer> lastSeen = new HashMap<>();\n        int left = 0, best = 0;\n        for (int right = 0; right < s.length(); right++) {\n            char c = s.charAt(right);\n            if (lastSeen.containsKey(c) && lastSeen.get(c) >= left)\n                left = lastSeen.get(c) + 1;\n            lastSeen.put(c, right);\n            best = Math.max(best, right - left + 1);\n        }\n        return best;\n    }\n}`;
const debugPy = `class Solution:\n    def two_sum(self, nums, target):\n        seen = {}\n        for i, n in enumerate(nums):\n            seen[n] = i  # BUG: state is updated too early\n            if target - n in seen:\n                return [seen[target - n], i]\n        return []`;
const debugJava = `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            seen.put(nums[i], i); // BUG: state is updated too early\n            if (seen.containsKey(target - nums[i]))\n                return new int[] { seen.get(target - nums[i]), i };\n        }\n        return new int[0];\n    }\n}`;
const time = (n) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

function Shell({ children, home }) {
  const go = (detail) => {
    if (detail === "home") home();
    else window.location.assign(`/?view=${detail}`);
  };
  return (
    <div className="shell">
      <aside className="side">
        <button
          className="brand"
          onClick={home}
          aria-label="Interview Suite home"
        >
          <b>
            <Sparkle weight="fill" />
          </b>
          <span>
            Interview
            <br />
            Suite
          </span>
        </button>
        <nav aria-label="Primary navigation">
          <button className="on" onClick={() => go("home")}>
            <Play weight="fill" /> Practice Loop
          </button>
          <button onClick={() => go("history")}>
            <FileText /> Past Interviews
          </button>
          <button onClick={() => go("plan")}>
            <TrendUp /> Improvement Plan
          </button>
        </nav>
        <div className="sidefoot">
          <button>
            <Gear /> Settings
          </button>
          <div>
            <UserCircle size={32} />
            <span>
              <strong>My practice</strong>
              <small>Private workspace</small>
            </span>
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
function Preview({ type }) {
  if (type === "design")
    return (
      <div className="preview designprev">
        <i>Client</i>
        <i>Gateway</i>
        <i>Services</i>
        <i>Database</i>
      </div>
    );
  if (type === "dsa")
    return (
      <div className="preview codeprev">
        <header>
          <BracketsCurly /> Coding room <b>Run</b>
        </header>
        <pre>
          def longest_sequence(nums):{"\n"} best = 0{"\n"} for value in nums:
          {"\n"} # your code here
        </pre>
      </div>
    );
  if (type === "debug")
    return (
      <div className="preview codeprev">
        <header>
          <WarningCircle /> Debugging room <b>3 failing</b>
        </header>
        <pre>
          seen[n] = i # state changes too early{"\n"}if target - n in seen:
          {"\n"} return [seen[target - n], i]
        </pre>
      </div>
    );
  return (
    <div className="preview phoneprev">
      <section>
        <b>Interviewer</b>
        <p>Tell me about a time you took ownership of a difficult project.</p>
        <i />
        <i />
        <i />
      </section>
      <pre>
        def two_sum(nums, target):{"\n"} seen = &#123;&#125;{"\n"} for i, n in
        enumerate(nums):
      </pre>
    </div>
  );
}
function Home({ level, setLevel, lang, setLang, start }) {
  return (
    <Shell home={() => {}}>
      <header className="homehead">
        <div>
          <small>Practice loop</small>
          <h1>Software Development Engineer Practice Loop</h1>
          <p>
            Four realistic rounds with role-appropriate questions, environments,
            and feedback after each round.
          </p>
        </div>
        <div className="toggle">
          <button
            aria-pressed={level === "SDE I"}
            className={level === "SDE I" ? "on" : ""}
            onClick={() => setLevel("SDE I")}
          >
            SDE I
          </button>
          <button
            aria-pressed={level === "SDE II"}
            className={level === "SDE II" ? "on" : ""}
            onClick={() => setLevel("SDE II")}
          >
            SDE II
          </button>
        </div>
      </header>
      <section className="rounds">
        {rounds.map((r, i) => (
          <article className="round" key={r.id}>
            <div className="rail">
              <b>{i + 1}</b>
              {i < rounds.length - 1 && <i />}
            </div>
            <div className="copy">
              <small>{i === 0 ? "Ready to start" : "Available anytime"}</small>
              <h2>{r.name}</h2>
              <h3>{r.sub}</h3>
              <div className="meta">
                <span>
                  <Clock /> {r.mins} minutes
                </span>
                {r.id !== "design" && (
                  <label>
                    <Code />
                    <select
                      aria-label={`${r.name} programming language`}
                      value={lang}
                      onChange={(e) => setLang(e.target.value)}
                    >
                      <option>Python</option>
                      <option>Java</option>
                    </select>
                  </label>
                )}
              </div>
              <p>
                {r.id === "phone"
                  ? "A conversational interview covering leadership principles and hands-on coding to assess impact, judgment, and technical depth."
                  : r.id === "dsa"
                    ? "Solve algorithmic problems in a focused environment with emphasis on reasoning, code quality, and complexity."
                    : r.id === "debug"
                      ? "Investigate failing tests, isolate the root cause, repair the implementation, and explain how you would prevent regression."
                      : "Choose LLD or HLD, build the design on a collaborative whiteboard, and explain every trade-off."}
              </p>
              <button
                className={i === 0 ? "primary" : "secondary"}
                onClick={() => start(r.id)}
              >
                {i === 0 ? <Play weight="fill" /> : <Desktop />}
                {i === 0 ? "Start Phone Screen" : "Open Round"}
              </button>
            </div>
            <Preview type={r.id} />
            <div className="skills">
              <strong>Key skills assessed</strong>
              <div>
                {r.skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <strong>Evaluation criteria</strong>
              <ul>
                {[
                  "Clarity of explanation",
                  "Technical correctness",
                  "Handling edge cases",
                  "Sound trade-offs",
                ].map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>
      <footer className="notice">
        <Lock /> Feedback is withheld until each round ends to preserve a
        realistic interview experience.
      </footer>
    </Shell>
  );
}
function useTimer() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const x = setInterval(() => setN((v) => v + 1), 1000);
    return () => clearInterval(x);
  }, []);
  return n;
}
function useShare() {
  const [on, setOn] = useState(false),
    stream = useRef();
  const toggle = async () => {
    if (on) {
      stream.current?.getTracks().forEach((t) => t.stop());
      setOn(false);
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      setOn(true);
      stream.current.getVideoTracks()[0].onended = () => setOn(false);
    } catch {
      setOn(false);
    }
  };
  return [on, toggle, stream];
}
async function frameFrom(stream) {
  if (!stream?.current) return null;
  const video = document.createElement("video");
  video.srcObject = stream.current;
  video.muted = true;
  await video.play();
  await new Promise((r) => setTimeout(r, 250));
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1280 / video.videoWidth);
  canvas.width = video.videoWidth * scale;
  canvas.height = video.videoHeight * scale;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  video.srcObject = null;
  return canvas.toDataURL("image/jpeg", 0.78);
}
function Top({ title, sub, mins, back, end }) {
  const elapsed = useTimer(),
    [share, toggle, stream] = useShare();
  const round = title.includes("Phone")
    ? "phone"
    : title.includes("Pairing")
      ? "dsa"
      : title.includes("Debugging")
        ? "debug"
        : "design";
  const level = sub.startsWith("SDE I ·") ? "SDE I" : "SDE II";
  const engine = useInterviewEngine({
    round,
    level,
    language: window.__interviewLanguage || "Python",
  });
  useEffect(() => {
    if (!share || engine.status !== "connected") return;
    const inspect = async () => {
      const image = await frameFrom(stream);
      if (image) engine.analyzeImage(image);
    };
    inspect();
    const id = setInterval(inspect, 30000);
    return () => clearInterval(id);
  }, [share, engine.status]);
  const finish = async () => {
    try {
      window.__lastEvaluation = await engine.evaluate({
        code: window.__currentArtifact || "",
        notes: window.__candidateNotes || "",
        durationSeconds: elapsed,
      });
    } catch (e) {
      window.__evaluationError = e.message;
    }
    end(elapsed);
  };
  return (
    <header className="top">
      <button className="icon" onClick={back}>
        <ArrowLeft />
      </button>
      <div className="title">
        <strong>{title}</strong>
        <small>
          {sub}
          {engine.error ? ` · ${engine.error}` : ""}
        </small>
      </div>
      <div className="timer">
        <strong>{time(elapsed)}</strong>
        <span>/ {mins}:00</span>
        <i>
          <b style={{ width: `${(elapsed / (mins * 60)) * 100}%` }} />
        </i>
      </div>
      <button className={share ? "util active" : "util"} onClick={toggle}>
        <MonitorArrowUp />
        {share ? "Sharing" : "Share screen"}
      </button>
      <button
        className={engine.status === "connected" ? "util active" : "util"}
        onClick={engine.connect}
      >
        {engine.status === "connected" ? <Microphone /> : <MicrophoneSlash />}
        {engine.status === "connecting"
          ? "Connecting"
          : engine.status === "playback-blocked"
            ? "Enable sound"
            : engine.status === "connected"
              ? "Voice live"
              : "Start voice"}
      </button>
      <button
        className="end"
        onClick={finish}
        disabled={engine.status === "evaluating"}
      >
        <Stop weight="fill" />{" "}
        {engine.status === "evaluating" ? "Evaluating…" : "End round"}
      </button>
    </header>
  );
}
function Editor({ lang, code, setCode, problem = "two-sum" }) {
  const [result, setResult] = useState(null),
    [running, setRunning] = useState(false);
  const passed = (result?.stdout?.match(/PASS/g) || []).length;
  const failed = (result?.stdout?.match(/FAIL/g) || []).length;
  const successful = Boolean(result?.ok && failed === 0);
  useEffect(() => {
    window.__currentArtifact = code;
    window.__interviewLanguage = lang;
  }, [code, lang]);
  const run = async () => {
    setRunning(true);
    try {
      const r = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, code, problem }),
      });
      setResult(await r.json());
    } catch (e) {
      setResult({ ok: false, stderr: e.message });
    }
    setRunning(false);
  };
  return (
    <div className="editor">
      <header>
        <span>
          <Code /> Solution.{lang === "Python" ? "py" : "java"}
        </span>
        <button onClick={run} disabled={running} aria-busy={running}>
          <Play weight="fill" /> {running ? "Running…" : "Run tests"}
        </button>
      </header>
      <textarea
        aria-label={`${lang} solution editor`}
        spellCheck="false"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      {result && (
        <footer aria-live="polite" className={successful ? "" : "failed"}>
          {successful ? (
            <CheckCircle weight="fill" />
          ) : (
            <WarningCircle weight="fill" />
          )}
          {result.ok
            ? `${passed} passed${failed ? ` · ${failed} failed` : ""}`
            : (result.stderr || result.stdout || "Execution failed").slice(
                0,
                160,
              )}
          <span>{successful ? "Executed locally" : "Fix and retry"}</span>
        </footer>
      )}
    </div>
  );
}
function Phone({ level, lang, back, finish }) {
  const [phase, setPhase] = useState("leadership"),
    [answer, setAnswer] = useState(""),
    [code, setCode] = useState(lang === "Python" ? py : java);
  return (
    <div className="screen light">
      <Top
        title="Phone Screen"
        sub={`${level} · Leadership & coding`}
        mins={50}
        back={back}
        end={() => finish("phone")}
      />
      <div className="phonegrid">
        <section className="conversation">
          <div className="speaker">
            <b>I</b>
            <span>
              <strong>Interviewer</strong>
              <small>Speaking now</small>
            </span>
            <Broadcast />
          </div>
          <h1>
            {phase === "leadership"
              ? "Tell me about a time you took ownership of a project that was at risk."
              : "Let’s move to coding. Walk me through your approach first."}
          </h1>
          <p className="probe">
            {phase === "leadership"
              ? "What trade-offs did you consider, and how did you know your decision was right for the customer?"
              : "Find two indices whose values add to the target. How would you handle duplicates?"}
          </p>
          {phase === "leadership" ? (
            <>
              <label className="answer">
                <span>Your live answer notes</span>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Speak naturally. Notes and transcript appear here…"
                />
              </label>
              <button className="primary" onClick={() => setPhase("coding")}>
                Continue to coding <ArrowRight />
              </button>
            </>
          ) : (
            <div className="phonecode">
              <section>
                <small>Coding problem</small>
                <h2>Two Sum</h2>
                <p>
                  Return the indices of two values that add up to the target.
                </p>
                <code>nums = [2,7,11,15], target = 9</code>
              </section>
              <Editor lang={lang} code={code} setCode={setCode} />
            </div>
          )}
        </section>
        <aside className="timeline">
          <h3>Interview timeline</h3>
          {[
            ["Introduction", "Completed"],
            [
              "Leadership Principles",
              phase === "leadership" ? "In progress" : "Completed",
            ],
            ["Coding", phase === "coding" ? "In progress" : "Upcoming"],
            ["Candidate Questions", "Upcoming"],
          ].map(([a, b], i) => (
            <div className={b.replace(" ", "").toLowerCase()} key={a}>
              <b>{b === "Completed" ? <Check /> : i + 1}</b>
              <span>
                <strong>{a}</strong>
                <small>{b}</small>
              </span>
            </div>
          ))}
          <footer>
            <Lock />
            <strong>Feedback is withheld until the round ends.</strong>
            <p>Interviewer notes remain private during the session.</p>
          </footer>
        </aside>
      </div>
    </div>
  );
}
function Dsa({ level, lang, back, finish }) {
  const [code, setCode] = useState(lang === "Python" ? dsaPy : dsaJava);
  return (
    <div className="screen">
      <Top
        title="Focused Pairing Room"
        sub={`${level} · Data Structures & Algorithms`}
        mins={55}
        back={back}
        end={() => finish("dsa")}
      />
      <div className="dsagrid">
        <section className="problem">
          <small>Problem</small>
          <h2>Longest Substring Without Repeating Characters</h2>
          <p>
            Given a string, find the length of the longest substring without
            repeating characters.
          </p>
          <code>
            <b>Input:</b> "abcabcbb"
            <br />
            <b>Output:</b> 3
          </code>
          <h4>Constraints</h4>
          <ul>
            <li>0 ≤ s.length ≤ 5 × 10⁴</li>
            <li>Letters, digits, symbols and spaces</li>
          </ul>
        </section>
        <main className="codework">
          <Editor
            lang={lang}
            code={code}
            setCode={setCode}
            problem="longest-substring"
          />
        </main>
        <aside className="interviewer">
          <div className="speaker">
            <b>I</b>
            <span>
              <strong>AI Interviewer</strong>
              <small>Listening…</small>
            </span>
            <Broadcast />
          </div>
          <small>Current question</small>
          <div className="question">
            Before you code, what edge cases do you want to handle?
          </div>
          <div className="transcript">
            <p>
              <b>Interviewer</b> Walk me through the data structure you would
              use.
            </p>
            <p>
              <b>You</b> A sliding window with a map of last-seen indices.
            </p>
            <p>
              <b>Interviewer</b> How will you keep the left pointer from moving
              backward?
            </p>
          </div>
          <div className="steps">
            {["Clarify", "Approach", "Code", "Test", "Complexity"].map(
              (x, i) => (
                <span className={i < 3 ? "done" : ""} key={x}>
                  <b>{i < 2 ? <Check /> : i + 1}</b>
                  {x}
                </span>
              ),
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
const baseNodes = [
  {
    id: "clients",
    position: { x: 20, y: 80 },
    data: { label: "Clients\nWeb · Mobile" },
  },
  {
    id: "gateway",
    position: { x: 220, y: 80 },
    data: { label: "API Gateway\nAuth · Rate limits" },
  },
  {
    id: "service",
    position: { x: 430, y: 80 },
    data: { label: "Notification Service\nOrchestration" },
  },
  {
    id: "queue",
    position: { x: 220, y: 270 },
    data: { label: "Message Queue\nDurable topics" },
  },
  {
    id: "workers",
    position: { x: 430, y: 270 },
    data: { label: "Workers\nRetries · DLQ" },
  },
  {
    id: "providers",
    position: { x: 640, y: 270 },
    data: { label: "Provider APIs\nEmail · SMS · Push" },
  },
];
const baseEdges = [
  ["clients", "gateway"],
  ["gateway", "service"],
  ["service", "queue"],
  ["queue", "workers"],
  ["workers", "providers"],
].map(([source, target], i) => ({
  id: `e${i}`,
  source,
  target,
  markerEnd: { type: MarkerType.ArrowClosed },
}));
function SystemCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes),
    [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);
  const onConnect = (params) =>
    setEdges((es) =>
      addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, es),
    );
  const add = () =>
    setNodes((ns) => [
      ...ns,
      {
        id: crypto.randomUUID(),
        position: { x: 300, y: 160 },
        data: { label: `New service ${ns.length + 1}` },
      },
    ]);
  useEffect(() => {
    window.__currentArtifact = JSON.stringify({ nodes, edges });
  }, [nodes, edges]);
  return (
    <main className="board">
      <header>
        <strong>Interactive whiteboard</strong>
        <span>Drag nodes · connect handles · select and press Delete</span>
        <button aria-label="Add service" onClick={add}>
          <Plus />
        </button>
      </header>
      <section>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          deleteKeyCode={["Backspace", "Delete"]}
          aria-label="System design canvas"
        >
          <Background color="#29445a" gap={20} />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </section>
      <footer>
        <span>
          <Graph /> Architecture
        </span>
        <span>
          <ShieldCheck /> Reliability
        </span>
        <span>
          <TrendUp /> Scalability
        </span>
      </footer>
    </main>
  );
}
function Design({ level, back, finish }) {
  const [mode, setMode] = useState("HLD");
  return (
    <div className="screen dark">
      <Top
        title="Design Studio Interview"
        sub={`${level} · ${mode} System Design`}
        mins={55}
        back={back}
        end={() => finish("design")}
      />
      <div className="designgrid">
        <aside className="brief">
          <h3>Interview brief</h3>
          <div className="designmode" aria-label="Design round type">
            <button
              aria-pressed={mode === "HLD"}
              onClick={() => setMode("HLD")}
            >
              HLD
            </button>
            <button
              aria-pressed={mode === "LLD"}
              onClick={() => setMode("LLD")}
            >
              LLD
            </button>
          </div>
          <p>
            {mode === "HLD"
              ? "Design a scalable, reliable notification system for a consumer product."
              : "Design an extensible notification library with channels, preferences, templates, retries, and provider adapters."}
          </p>
          <hr />
          <h4>Functional requirements</h4>
          <ol>
            <li>Multiple channels</li>
            <li>User preferences</li>
            <li>High throughput</li>
            <li>Retries and idempotency</li>
            <li>Delivery status</li>
          </ol>
          <h4>Scale estimates</h4>
          <dl>
            <dt>Daily users</dt>
            <dd>100M</dd>
            <dt>Peak QPS</dt>
            <dd>60K</dd>
            <dt>Retention</dt>
            <dd>30 days</dd>
          </dl>
        </aside>
        <SystemCanvas />
        <aside className="designvoice">
          <div>
            <Microphone weight="fill" />
          </div>
          <small>AI interviewer · Live</small>
          <p>
            If a provider is down or returning elevated errors, how would you
            prevent user-visible failures?
          </p>
          <hr />
          <b>You</b>
          <span>
            I would use exponential backoff and a circuit breaker per provider.
          </span>
          <b>Interviewer</b>
          <span>How would you preserve ordering while messages retry?</span>
        </aside>
      </div>
    </div>
  );
}
function DebugRound({ level, lang, back, finish }) {
  const [code, setCode] = useState(lang === "Python" ? debugPy : debugJava);
  return (
    <div className="screen">
      <Top
        title="Debugging Room"
        sub={`${level} · Diagnose and repair`}
        mins={45}
        back={back}
        end={() => finish("debug")}
      />
      <div className="dsagrid debuggrid">
        <section className="problem">
          <small>Production incident</small>
          <h2>Duplicate index returned for valid input</h2>
          <p>
            The Two Sum service intermittently returns the same index twice.
            Reproduce the bug, identify the invariant violation, repair it, and
            explain a regression test.
          </p>
          <code>
            <b>Failing input:</b> nums = [3,3], target = 6<br />
            <b>Incorrect:</b> [0,0]
            <br />
            <b>Expected:</b> [0,1]
          </code>
          <h4>Interview goals</h4>
          <ul>
            <li>Form a hypothesis before editing</li>
            <li>Use tests to isolate the defect</li>
            <li>Explain why the fix is safe</li>
          </ul>
        </section>
        <main className="codework">
          <Editor lang={lang} code={code} setCode={setCode} problem="two-sum" />
        </main>
        <aside className="interviewer">
          <div className="speaker">
            <b>I</b>
            <span>
              <strong>AI Interviewer</strong>
              <small>Observing…</small>
            </span>
            <Broadcast />
          </div>
          <small>Current question</small>
          <div className="question">
            What invariant should hold before you insert the current value into
            the map?
          </div>
          <div className="transcript">
            <p>
              <b>Interviewer</b> Reproduce the failure before changing the code.
            </p>
            <p>
              <b>You</b> The current index becomes eligible as its own
              complement.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
function Feedback({ round, home }) {
  const live = window.__lastEvaluation?.evaluation;
  const score =
    live?.score ?? (round === "dsa" ? 82 : round === "design" ? 78 : 80);
  const strengths =
    live?.strengths ??
    [
      "Clarified requirements before solving",
      "Communicated a structured approach",
      "Produced a sound core solution",
    ].map((title) => ({
      title,
      evidence:
        "Evidence captured from this round’s transcript and workspace activity.",
    }));
  const improvements =
    live?.improvements ??
    [
      "Quantify outcomes and trade-offs",
      "Test edge cases explicitly",
      "Reserve time for final verification",
    ].map((title) => ({
      title,
      evidence: "Practice this explicitly in the next equivalent round.",
    }));
  return (
    <Shell home={home}>
      <div className="feedback">
        <button onClick={home}>
          <ArrowLeft /> Back to practice loop
        </button>
        <small>{live ? "AI evaluation complete" : "Round complete"}</small>
        <h1>{rounds.find((r) => r.id === round)?.name} feedback</h1>
        <header>
          <div>
            <strong>{score}</strong>
            <span>/ 100</span>
          </div>
          <section>
            <b>
              <CheckCircle weight="fill" /> {live?.signal || "Positive signal"}
            </b>
            <h2>
              {live?.summary || "Strong foundations with clear next steps"}
            </h2>
            <p>
              {window.__evaluationError
                ? `Live evaluation was unavailable: ${window.__evaluationError}`
                : "Evaluation is grounded in your transcript, code, and workspace actions."}
            </p>
          </section>
        </header>
        <main>
          <section>
            <h3>
              <CheckCircle /> What went well
            </h3>
            {strengths.map((x, i) => (
              <article key={x.title}>
                <b>{i + 1}</b>
                <span>
                  <strong>{x.title}</strong>
                  <p>{x.evidence}</p>
                </span>
              </article>
            ))}
          </section>
          <section>
            <h3>
              <WarningCircle /> Focus next
            </h3>
            {improvements.map((x, i) => (
              <article key={x.title}>
                <b>{i + 1}</b>
                <span>
                  <strong>{x.title}</strong>
                  <p>
                    {x.evidence}
                    {x.drill ? ` Next drill: ${x.drill}` : ""}
                  </p>
                </span>
              </article>
            ))}
          </section>
        </main>
        <footer>
          <button className="secondary" onClick={home}>
            Return to loop
          </button>
          <button className="primary" onClick={home}>
            Continue practice <ArrowRight />
          </button>
        </footer>
      </div>
    </Shell>
  );
}
function History({ home }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);
  return (
    <Shell home={home}>
      <div className="history">
        <small>Progress</small>
        <h1>Past interviews & improvement plan</h1>
        <p>
          Every completed round is saved locally with transcript evidence,
          artifacts, and an AI evaluation.
        </p>
        {items === null ? (
          <div className="empty">Loading interview history…</div>
        ) : items.length === 0 ? (
          <div className="empty">
            <FileText size={36} />
            <h2>No completed interviews yet</h2>
            <p>Finish a round to create your first evidence-based report.</p>
            <button className="primary" onClick={home}>
              Start a practice loop
            </button>
          </div>
        ) : (
          <div className="historylist">
            {items.map((item) => (
              <article key={item.id}>
                <div className="scorechip">{item.evaluation.score}</div>
                <div>
                  <small>
                    {new Date(item.createdAt).toLocaleDateString()} ·{" "}
                    {item.level} · {item.language}
                  </small>
                  <h2>{rounds.find((r) => r.id === item.round)?.name}</h2>
                  <p>{item.evaluation.summary}</p>
                  <div className="tags">
                    <span>{item.evaluation.signal}</span>
                    <span>{Math.round(item.durationSeconds / 60)} min</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
function Plan({ home }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);
  const drills = (items || [])
    .flatMap((x) => x.evaluation.improvements || [])
    .slice(0, 6);
  return (
    <Shell home={home}>
      <div className="history">
        <small>Personalized practice</small>
        <h1>Improvement plan</h1>
        <p>
          Your plan is generated from evidence across completed rounds, with
          equivalent-question retakes.
        </p>
        {items === null ? (
          <div className="empty">Building your plan…</div>
        ) : drills.length === 0 ? (
          <div className="empty">
            <TrendUp size={36} />
            <h2>Complete a round to unlock your plan</h2>
            <p>
              We need transcript and workspace evidence before recommending
              drills.
            </p>
            <button className="primary" onClick={home}>
              Start an interview
            </button>
          </div>
        ) : (
          <div className="historylist">
            {drills.map((x, i) => (
              <article key={`${x.title}-${i}`}>
                <div className="scorechip">{i + 1}</div>
                <div>
                  <small>Recommended drill</small>
                  <h2>{x.title}</h2>
                  <p>{x.drill}</p>
                  <div className="tags">
                    <span>Evidence: {x.evidence}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
export function App() {
  const [view, setView] = useState(
      () => new URLSearchParams(location.search).get("view") || "home",
    ),
    [level, setLevel] = useState("SDE II"),
    [lang, setLang] = useState("Python"),
    [done, setDone] = useState();
  const home = () => {
    history.replaceState({}, "", "/");
    setView("home");
  };
  const finish = (r) => {
    setDone(r);
    setView("feedback");
  };
  if (view === "history") return <History home={home} />;
  if (view === "plan") return <Plan home={home} />;
  if (view === "feedback") return <Feedback round={done} home={home} />;
  if (view === "phone")
    return <Phone level={level} lang={lang} back={home} finish={finish} />;
  if (view === "dsa")
    return <Dsa level={level} lang={lang} back={home} finish={finish} />;
  if (view === "design")
    return <Design level={level} back={home} finish={finish} />;
  if (view === "debug")
    return <DebugRound level={level} lang={lang} back={home} finish={finish} />;
  return (
    <Home
      level={level}
      setLevel={setLevel}
      lang={lang}
      setLang={setLang}
      start={setView}
    />
  );
}
