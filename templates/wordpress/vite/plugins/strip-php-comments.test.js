import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { stripPhpComments } from "./strip-php-comments.js";

describe("stripPhpComments", () => {
  it("// コメントを除去する", () => {
    assert.equal(stripPhpComments("<?php\n$a = 1; // note\n$b = 2;"), "<?php\n$a = 1; \n$b = 2;");
  });

  it("# コメントを除去する", () => {
    assert.equal(stripPhpComments("<?php\n# note\n$a = 1;"), "<?php\n\n$a = 1;");
  });

  it("/* */ コメントを除去する", () => {
    assert.equal(stripPhpComments("<?php /* assets_url('images/a.png') */ $a = 1;"), "<?php  $a = 1;");
  });

  it("行コメントは ?> で終わる", () => {
    assert.equal(
      stripPhpComments("<?php // note ?><img src=\"<?php echo assets_url('images/a.png'); ?>\">"),
      "<?php ?><img src=\"<?php echo assets_url('images/a.png'); ?>\">"
    );
  });

  it("HTML 部分の // は除去しない", () => {
    const input = `<a href="https://example.com"><img src="<?php echo assets_url("images/a.png"); ?>"></a>`;
    assert.equal(stripPhpComments(input), input);
  });

  it("PHP 文字列内の // や /* は除去しない", () => {
    const input = `<?php $url = "https://example.com/*"; echo assets_url('images/a.png'); ?>`;
    assert.equal(stripPhpComments(input), input);
  });

  it("エスケープされた引用符で文字列が終わらない", () => {
    const input = `<?php $s = 'it\\'s // not a comment'; echo assets_url("images/a.png");`;
    assert.equal(stripPhpComments(input), input);
  });

  it("HTML 中のアポストロフィで文字列扱いにならない", () => {
    const input = `<p>Don't</p><?php // note\necho 1; ?>`;
    assert.equal(stripPhpComments(input), "<p>Don't</p><?php \necho 1; ?>");
  });

  it("#[ で始まるアトリビュートは残す", () => {
    const input = "<?php\n#[Attribute]\nclass A {}";
    assert.equal(stripPhpComments(input), input);
  });
});
