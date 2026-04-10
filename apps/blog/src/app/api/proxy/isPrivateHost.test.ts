import { describe, expect, it } from "bun:test";
import { isPrivateHost } from "./isPrivateHost";

describe("isPrivateHost", () => {
  it("blocks localhost", () => {
    expect(isPrivateHost("localhost")).toBe(true);
  });

  it("blocks 127.0.0.1 loopback", () => {
    expect(isPrivateHost("127.0.0.1")).toBe(true);
  });

  it("blocks 127.x.x.x range", () => {
    expect(isPrivateHost("127.255.255.255")).toBe(true);
  });

  it("blocks 10.x private range", () => {
    expect(isPrivateHost("10.0.0.1")).toBe(true);
    expect(isPrivateHost("10.255.255.255")).toBe(true);
  });

  it("blocks 172.16.x through 172.31.x", () => {
    expect(isPrivateHost("172.16.0.1")).toBe(true);
    expect(isPrivateHost("172.31.255.255")).toBe(true);
  });

  it("does not block 172.15.x or 172.32.x (outside range)", () => {
    expect(isPrivateHost("172.15.0.1")).toBe(false);
    expect(isPrivateHost("172.32.0.1")).toBe(false);
  });

  it("blocks 192.168.x.x", () => {
    expect(isPrivateHost("192.168.0.1")).toBe(true);
    expect(isPrivateHost("192.168.255.255")).toBe(true);
  });

  it("blocks link-local 169.254.x.x", () => {
    expect(isPrivateHost("169.254.0.1")).toBe(true);
    expect(isPrivateHost("169.254.169.254")).toBe(true); // AWS metadata
  });

  it("blocks 0.x.x.x", () => {
    expect(isPrivateHost("0.0.0.0")).toBe(true);
    expect(isPrivateHost("0.255.255.255")).toBe(true);
  });

  it("allows public IP addresses", () => {
    expect(isPrivateHost("8.8.8.8")).toBe(false);
    expect(isPrivateHost("1.1.1.1")).toBe(false);
    expect(isPrivateHost("203.0.113.1")).toBe(false);
  });

  it("allows public hostnames", () => {
    expect(isPrivateHost("example.com")).toBe(false);
    expect(isPrivateHost("api.github.com")).toBe(false);
  });
});
