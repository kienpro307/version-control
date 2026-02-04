/**
 * Utility functions for semantic version parsing and sorting
 */

interface ParsedVersion {
    major: number;
    minor: number;
    patch: number;
    raw: string;
}

/**
 * Parse version string to extract semver components
 * Handles formats: "v1.2.3", "1.2.3", "v1.2", "1.2", "v1", "1"
 */
export function parseVersion(name: string): ParsedVersion {
    // Remove common prefixes and get the version part
    const versionMatch = name.match(/v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/i);

    if (!versionMatch) {
        // Non-semantic version, return 0.0.0
        return { major: 0, minor: 0, patch: 0, raw: name };
    }

    return {
        major: parseInt(versionMatch[1], 10) || 0,
        minor: parseInt(versionMatch[2], 10) || 0,
        patch: parseInt(versionMatch[3], 10) || 0,
        raw: name,
    };
}

/**
 * Compare two parsed versions
 * Returns: positive if a > b, negative if a < b, 0 if equal
 */
export function compareVersions(a: ParsedVersion, b: ParsedVersion): number {
    // Compare major
    if (a.major !== b.major) {
        return a.major - b.major;
    }
    // Compare minor
    if (a.minor !== b.minor) {
        return a.minor - b.minor;
    }
    // Compare patch
    return a.patch - b.patch;
}

/**
 * Sort versions in descending order (largest first)
 */
export function sortVersionsDescending<T extends { name: string }>(versions: T[]): T[] {
    return [...versions].sort((a, b) => {
        const parsedA = parseVersion(a.name);
        const parsedB = parseVersion(b.name);
        // Descending: b - a
        return compareVersions(parsedB, parsedA);
    });
}
