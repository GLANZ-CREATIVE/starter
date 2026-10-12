/**
 * PHP ソースからコメントを除去する。
 *
 * `<?php ... ?>` の内側だけを対象にし、文字列リテラル内の `//` `/*` `#` は残す。
 * HTML 部分（`href="https://..."` など）には手を付けない。
 *
 * @param {string} content
 * @returns {string}
 */
export function stripPhpComments(content) {
  let out = "";
  let i = 0;
  let inPhp = false;

  while (i < content.length) {
    if (!inPhp) {
      const open = content.indexOf("<?", i);
      if (open === -1) {
        out += content.slice(i);
        break;
      }
      out += content.slice(i, open + 2);
      i = open + 2;
      inPhp = true;
      continue;
    }

    const ch = content[i];
    const next = content[i + 1];

    if (ch === "?" && next === ">") {
      out += "?>";
      i += 2;
      inPhp = false;
      continue;
    }

    if (ch === "'" || ch === '"') {
      const end = findStringEnd(content, i);
      out += content.slice(i, end);
      i = end;
      continue;
    }

    if (ch === "/" && next === "*") {
      const end = content.indexOf("*/", i + 2);
      i = end === -1 ? content.length : end + 2;
      continue;
    }

    // `#[` は PHP 8 のアトリビュートなのでコメントではない
    if ((ch === "/" && next === "/") || (ch === "#" && next !== "[")) {
      i = findLineCommentEnd(content, i);
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

/**
 * 文字列リテラルの終端（閉じ引用符の次）の位置を返す。
 *
 * @param {string} content
 * @param {number} start 開き引用符の位置
 * @returns {number}
 */
function findStringEnd(content, start) {
  const quote = content[start];
  let i = start + 1;

  while (i < content.length) {
    if (content[i] === "\\") {
      i += 2;
      continue;
    }
    if (content[i] === quote) {
      return i + 1;
    }
    i++;
  }

  return content.length;
}

/**
 * 行コメントの終端を返す。PHP の行コメントは改行か `?>` で終わる。
 *
 * @param {string} content
 * @param {number} start
 * @returns {number}
 */
function findLineCommentEnd(content, start) {
  let i = start;

  while (i < content.length) {
    if (content[i] === "\n" || (content[i] === "?" && content[i + 1] === ">")) {
      return i;
    }
    i++;
  }

  return content.length;
}
