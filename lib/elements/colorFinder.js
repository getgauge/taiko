function isHexColor(value) {
  if (value.charAt(0) === "#") {
    value = value.substring(1);
  }
  return (
    typeof value === "string" &&
    value.length === 6 &&
    !isNaN(Number("0x" + value))
  );
}

function isRgb(rgb) {
  const values = rgb.match(/\d+/g).map(Number);
  return values.length === 3 ? true : false;
}

function isValidColor(value) {
  if (isHexColor(value)) {
    this.hex = true;
    return true;
  }
  if (isRgb(value)) {
    this.rgb = true;
    return true;
  }
  return false;
}

function convertFullRGBToHex(value) {
  const [r, g, b] = value.match(/\d+/g).map(Number);
  var red = rgbToHex(r);
  var green = rgbToHex(g);
  var blue = rgbToHex(b);
  return "#" + red + green + blue;
}

function rgbToHex(rgb) {
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
    hex = "0" + hex;
  }
  return hex;
}

module.exports = {
  convertFullRGBToHex,
  isValidColor,
  isRgb,
};
