
/**
 * Blends a hex color with white (positive percent) or black (negative percent).
 * Uses linear interpolation for true color shifting, supporting #000000.
 */
export const shadeColor = (color: string, percent: number): string => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    const t = percent < 0 ? 0 : 255;
    const p = Math.abs(percent) / 100;

    R = Math.round(R + (t - R) * p);
    G = Math.round(G + (t - G) * p);
    B = Math.round(B + (t - B) * p);

    const RR = R.toString(16).padStart(2, '0');
    const GG = G.toString(16).padStart(2, '0');
    const BB = B.toString(16).padStart(2, '0');

    return "#" + RR + GG + BB;
};

/**
 * Determines if a color is "dark" based on perceived luminance.
 * Useful for choosing contrasting text colors.
 */
export const isDark = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // standard perceived luminance formula
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 155; // Threshold for dark vs light
};
