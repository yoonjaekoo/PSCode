export interface OnlineCompilerResult {
  output: string;
  error: string;
  status: "success" | "error";
  exit_code: number;
  signal: number | null;
  time: string;
  total: string;
  memory: string;
}

export const ONLINE_COMPILER_URL = "https://api.onlinecompiler.io/api/run-code-sync/";
export const DEFAULT_COMPILER = "g++-15";

export const onlineCompilerService = {
  async compileAndRun(
    code: string,
    input: string,
    apiKey: string,
    compiler: string = DEFAULT_COMPILER,
  ): Promise<OnlineCompilerResult> {
    const response = await fetch(ONLINE_COMPILER_URL, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ compiler, code, input }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `OnlineCompiler API error (${response.status}): ${text}`,
      );
    }

    return response.json();
  },
};
