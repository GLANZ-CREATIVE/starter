import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { runQuietly } from "../lib/run.js";

describe("runQuietly", () => {
  test("成功したら出力を画面に出さずに終わる", async () => {
    await runQuietly(process.execPath, ["-e", "console.log('installing'); console.error('warn')"], {});
  });

  test("失敗したら、コマンドと終了コードに加えて、溜めておいた出力をエラーに含める", async () => {
    await assert.rejects(
      runQuietly(process.execPath, ["-e", "console.log('resolving'); console.error('ERR_PNPM_X 壊れた'); process.exit(3)"], {}),
      (error) => {
        assert.match(error.message, /が失敗しました（終了コード 3）/);
        assert.match(error.message, /resolving/);
        assert.match(error.message, /ERR_PNPM_X 壊れた/);
        return true;
      },
    );
  });

  test("コマンドが見つからなければエラーにする", async () => {
    await assert.rejects(runQuietly("command-that-does-not-exist", [], {}), /ENOENT/);
  });
});
