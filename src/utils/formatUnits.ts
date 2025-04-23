import { BigInt } from "@graphprotocol/graph-ts";

export function formatUnits(value: BigInt, decimals: i32): string {
  // Convert the value to a string
  let display = value.toString();

  // Handle negative values
  let negative = display.startsWith("-");
  if (negative) {
    display = display.slice(1);
  }

  // Pad the display to ensure it has enough digits
  display = display.padStart(decimals, "0");

  // Split the display into integer and fractional parts
  let integerPart = display.slice(0, display.length - decimals);
  let fractionPart = display.slice(display.length - decimals);

  // Manually remove trailing zeros from the fractional part
  while (fractionPart.length > 0 && fractionPart.endsWith("0")) {
    fractionPart = fractionPart.slice(0, -1);
  }

  // Construct the final formatted string
  return `${negative ? "-" : ""}${integerPart || "0"}${
    fractionPart.length > 0 ? `.${fractionPart}` : ""
  }`;
}
