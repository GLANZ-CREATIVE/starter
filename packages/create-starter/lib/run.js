import { spawn } from "node:child_process";

// スピナーの行に子プロセスの出力が混ざらないよう、出力は溜めておき、失敗したときだけ見せる
export function runQuietly(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    const output = [];
    child.stdout.on("data", (chunk) => output.push(chunk));
    child.stderr.on("data", (chunk) => output.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve();
      const log = Buffer.concat(output).toString().trimEnd();
      reject(new Error(`${command} ${args.join(" ")} が失敗しました（終了コード ${code}）${log ? `\n\n${log}` : ""}`));
    });
  });
}
