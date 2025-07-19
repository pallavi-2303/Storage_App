"use client";
import emailjs from "emailjs-com";

export const sendOTPViaEmailJs = async ({
  email,
  otp,
  time,
}: {
  email: string;
  otp: string;
  time: string;
}) => {
  try {
    // Optional: check if env vars are loaded
    if (
      !process.env.NEXT_PUBLIC_EMAILJS_SERVICEID ||
      !process.env.NEXT_PUBLIC_EMAILJS_TEMPLATEID ||
      !process.env.NEXT_PUBLIC_EMAILJS_PUBLICID
    ) {
      throw new Error("Missing EmailJS environment variables");
    }

    const result = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICEID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATEID!,
      {
        email: email,
        passcode: otp,
        time: time,
      },
      process.env.NEXT_PUBLIC_EMAILJS_PUBLICID!
    );

    console.log("Email sent:", result.text);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
};
