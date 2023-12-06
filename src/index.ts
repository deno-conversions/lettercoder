import { decodeBase64 as toByteArray } from "https://deno.land/std@0.208.0/encoding/base64.ts";

if (typeof TextDecoder === "undefined") {
  // @ts-ignore Isomorphism (Deno-specific).
  const nodeVer = typeof process !== "undefined" && process.versions?.node;
  const nodeRequire = nodeVer
    // @ts-ignore Isomorphism.
    ? typeof __webpack_require__ === "function"
      // @ts-ignore Isomorphism.
      ? __non_webpack_require__
      // @ts-ignore Isomorphism (Deno-specific).
      : require
    : undefined;
  // @ts-ignore Isomorphism.
  global["TextDecoder"] = nodeRequire("util").TextDecoder;
}

const CHAR_SPACE = 0x20;

function decodeQAndQP(input: string, encoding?: string, isQ = false) {
  const lines = input.replace(/\r/g, "").split("\n");
  let tempStr = "";

  for (let line of lines) {
    if (line.endsWith("=")) {
      tempStr += line.substring(0, line.length - 1);
    } else {
      tempStr += line + "\n";
    }
  }

  if (tempStr.endsWith("\n")) {
    tempStr = tempStr.substring(0, tempStr.length - 1);
  }

  const bytes: number[] = [];
  for (let i = 0; i < tempStr.length; i++) {
    const char = tempStr.charAt(i);
    const charCode = tempStr.charCodeAt(i);

    switch (char) {
      case "=":
        const hex = parseInt(tempStr.charAt(i + 1) + tempStr.charAt(i + 2), 16);
        if (hex) {
          bytes.push(hex);
          i += 2;
        } else {
          bytes.push(charCode);
        }
        break;
      case "_":
        bytes.push(isQ ? CHAR_SPACE : charCode);
        break;
      default:
        bytes.push(charCode);
    }
  }

  const typedArray = Uint8Array.from(bytes);
  if (encoding) {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(typedArray);
  } else {
    return typedArray;
  }
}

/**
 * Decodes strings containing multiple MIME words (RFC 2047).
 * @param input
 */
export function decodeMimeWords(input: string) {
  const atoms = input.replace(/\s+/g, " ").split(" ");
  let output = "";
  let wasMimeWord = false;

  for (let atom of atoms) {
    if (isMimeWord(atom)) {
      if (!wasMimeWord && output !== "") {
        output += " ";
      }
      output += decodeMimeWord(atom);

      wasMimeWord = true;
    } else {
      if (output !== "") {
        output += " " + atom.trim();
      } else {
        output += atom.trim();
      }

      wasMimeWord = false;
    }
  }

  return output.trim();
}

export function isMimeWord(input: string) {
  if (!input.startsWith("=?") || !input.endsWith("?=") || input.includes(" ")) {
    return false;
  }

  const split = input.split("?");
  if (split.length !== 5) {
    return false;
  }

  const type = split[2].toLowerCase();
  return type === "q" || type === "b";
}

/**
 * Decodes one MIME word (RFC 2047). Note: if an input contains more than one RFC 822 atom (i.e. input contains spaces) no decoding will be performed, use decodeMimeWords instead.
 * @param input
 */
export function decodeMimeWord(input: string) {
  if (!isMimeWord(input)) {
    return input;
  }

  let [encoding, type, value] = input.split("?").slice(1, 4);

  // Remove language tag.
  encoding = encoding.split("*")[0].toLowerCase();
  type = type.toLowerCase();

  switch (type) {
    case "b":
      const bytes = toByteArray(value);
      if (bytes) {
        const decoder = new TextDecoder(encoding);
        return decoder.decode(bytes);
      } else {
        return input;
      }
    case "q":
      return decodeQAndQP(value, encoding, true);
    default:
      return input;
  }
}

/**
 * Decodes Quoted-Printable (RFC 2045) strings.
 * @param input
 * @param encoding Encoding of the input, omit the argument for the function to return an UInt8Array.
 */
export function decodeQuotedPrintable(input: string, encoding?: string) {
  return decodeQAndQP(input, encoding, false);
}
