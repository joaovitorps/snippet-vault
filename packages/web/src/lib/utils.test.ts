import { cn, getInitials } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", undefined, null, false, "extra")).toBe("base extra");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });
});

describe("getInitials", () => {
  it("returns initials from the first two words", () => {
    expect(getInitials("Test User")).toBe("TU");
  });

  it("returns one initial when only one valid token exists", () => {
    expect(getInitials("SnippetVault")).toBe("S");
  });

  it("returns at most two initials", () => {
    expect(getInitials("One Two Three")).toBe("OT");
  });

  it("allows numbers in initials", () => {
    expect(getInitials("9 lives")).toBe("9L");
  });

  it("filters special characters before choosing initials", () => {
    expect(getInitials("!!!alice @ .example.com")).toBe("AE");
  });

  it("uses the email local part and domain for initials", () => {
    expect(getInitials("test@example.com")).toBe("TE");
  });

  it("filters non-ASCII letters", () => {
    expect(getInitials("Éclair Łukasz")).toBe("CU");
  });

  it("returns an empty string when no valid ASCII letters or numbers exist", () => {
    expect(getInitials("!!! @ ...")).toBe("");
  });
});
