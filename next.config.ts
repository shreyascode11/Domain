import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev badge sat on top of the game's controls hint. Compile and
  // runtime errors are still shown.
  devIndicators: false,
  // Don't generate AGENTS.md / CLAUDE.md when an AI agent runs `next dev`.
  agentRules: false,
};

export default nextConfig;
