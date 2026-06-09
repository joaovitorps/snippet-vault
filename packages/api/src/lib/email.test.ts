const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function Resend() {
    return {
      emails: {
        send: mockSend,
      },
    };
  }),
}));

import { sendMagicLinkEmail } from "./email.js";

describe("sendMagicLinkEmail", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({});
  });

  it("sends magic link email copy with the configured expiry", async () => {
    await sendMagicLinkEmail({
      to: "user@example.com",
      url: "https://example.com/magic-link",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("This link expires in 10 minutes."),
      }),
    );
  });
});
