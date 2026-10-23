import { useCallback, useEffect, useRef, useState } from "react";

export function useInterviewEngine({ round, level, language }) {
  const [status, setStatus] = useState("idle");
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const pcRef = useRef(null),
    dcRef = useRef(null),
    streamRef = useRef(null),
    audioRef = useRef(null);
  const add = useCallback(
    (role, text) =>
      text &&
      setEvents((v) => [...v, { role, text, at: new Date().toISOString() }]),
    [],
  );

  const cleanup = useCallback(() => {
    dcRef.current?.close();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioRef.current?.remove();
    dcRef.current = pcRef.current = streamRef.current = audioRef.current = null;
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus("idle");
  }, [cleanup]);

  const sendContext = useCallback((text, image) => {
    if (dcRef.current?.readyState !== "open") return;
    dcRef.current.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: image
            ? [
                { type: "input_text", text },
                { type: "input_image", image_url: image, detail: "high" },
              ]
            : [{ type: "input_text", text }],
        },
      }),
    );
  }, []);

  const connect = useCallback(async () => {
    if (status === "playback-blocked" && audioRef.current) {
      try {
        await audioRef.current.play();
        setError("");
        setStatus("connected");
      } catch {
        setError(
          "Browser audio is blocked. Allow sound for localhost and try again.",
        );
      }
      return;
    }
    if (status === "connected") return disconnect();
    setError("");
    setStatus("connecting");
    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.playsInline = true;
      audio.muted = false;
      audio.volume = 1;
      audio.setAttribute("aria-hidden", "true");
      audioRef.current = audio;
      document.body.appendChild(audio);
      pc.ontrack = async (e) => {
        audio.srcObject = e.streams[0] || new MediaStream([e.track]);
        try {
          await audio.play();
        } catch {
          setStatus("playback-blocked");
          setError(
            "Sound is ready. Click Enable sound to hear the interviewer.",
          );
        }
      };
      pc.onconnectionstatechange = () => {
        if (["failed", "disconnected"].includes(pc.connectionState)) {
          setError(
            "Voice connection was interrupted. Click Start voice to reconnect.",
          );
          cleanup();
          setStatus("error");
        }
      };
      try {
        const stream = await Promise.race([
          navigator.mediaDevices.getUserMedia({ audio: true }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Microphone permission timed out.")),
              8000,
            ),
          ),
        ]);
        streamRef.current = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      } catch {
        pc.addTransceiver("audio", { direction: "recvonly" });
        setError(
          "Listen-only mode · Open in Chrome or Safari and allow microphone access to answer by voice.",
        );
      }
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onopen = () => {
        setStatus("connected");
        dc.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions:
                "Begin the interview now with a brief introduction and the first question.",
            },
          }),
        );
      };
      dc.onmessage = (e) => {
        try {
          const x = JSON.parse(e.data);
          if (
            x.type === "conversation.item.input_audio_transcription.completed"
          )
            add("You", x.transcript);
          if (
            x.type === "response.output_audio_transcript.done" ||
            x.type === "response.audio_transcript.done"
          )
            add("Interviewer", x.transcript);
          if (x.type === "error")
            setError(x.error?.message || "Voice session error");
        } catch {}
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const response = await fetch("/api/realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: offer.sdp, round, level, language }),
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).error || "Could not start voice",
        );
      await pc.setRemoteDescription({
        type: "answer",
        sdp: await response.text(),
      });
    } catch (e) {
      setError(e.message);
      cleanup();
      setStatus("error");
    }
  }, [status, disconnect, cleanup, round, level, language, add]);

  const analyzeImage = useCallback(
    async (image) => {
      try {
        const r = await fetch("/api/analyze-screen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image, round }),
        });
        const x = await r.json();
        if (!r.ok) throw new Error(x.error);
        add("Screen analysis", x.analysis);
        sendContext(`Screen observation: ${x.analysis}`);
        return x.analysis;
      } catch (e) {
        setError(e.message);
      }
    },
    [round, add, sendContext],
  );

  const evaluate = useCallback(
    async ({ code = "", notes = "", durationSeconds = 0 }) => {
      setStatus("evaluating");
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round,
          level,
          language,
          transcript: events,
          code,
          notes,
          durationSeconds,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      disconnect();
      return result;
    },
    [round, level, language, events, disconnect],
  );

  useEffect(() => disconnect, [disconnect]);
  return {
    status,
    events,
    error,
    connect,
    disconnect,
    sendContext,
    analyzeImage,
    evaluate,
  };
}
