import { afterAll, afterEach, expect, spyOn, test } from "bun:test";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { r2Store } from "../content/r2";
import { sha256 } from "../content/release";

const credentials = {
  R2_ACCOUNT_ID: "0".repeat(32),
  R2_BUCKET: "test-bucket",
  R2_ACCESS_KEY_ID: "test-access-key",
  R2_SECRET_ACCESS_KEY: "test-secret-key",
};
const payload = new TextEncoder().encode("immutable payload");
const serviceError = (status: number) =>
  new S3ServiceException({
    name: "TestServiceError",
    $fault: "client",
    $metadata: { httpStatusCode: status },
  });
const send = spyOn(S3Client.prototype, "send");
afterEach(() => send.mockReset());
afterAll(() => send.mockRestore());

function streamed(bytes: Uint8Array) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  return Object.assign(stream, {
    transformToWebStream: () => stream,
    transformToByteArray: async () => bytes,
    transformToString: async () => new TextDecoder().decode(bytes),
  });
}

test("R2 conditional creation races accept only identical remote bytes", async () => {
  send.mockImplementation((command) => {
    if (command instanceof HeadObjectCommand) {
      return Promise.reject(serviceError(404));
    }
    if (command instanceof PutObjectCommand) {
      expect(command.input.IfNoneMatch).toBe("*");
      expect(command.input.Metadata?.sha256).toBe(sha256(payload));
      return Promise.reject(serviceError(412));
    }
    if (command instanceof GetObjectCommand) {
      return Promise.resolve({
        $metadata: {},
        Body: streamed(payload),
        ContentLength: payload.length,
      });
    }
    return Promise.reject(new Error("Unexpected command"));
  });
  await expect(
    r2Store(credentials).putIfAbsent("object", payload)
  ).resolves.toBeUndefined();
  expect(send).toHaveBeenCalledTimes(3);
});

test("R2 conditional creation rejects a conflicting raced object", async () => {
  send.mockImplementation((command) => {
    if (command instanceof HeadObjectCommand) {
      return Promise.reject(serviceError(404));
    }
    if (command instanceof PutObjectCommand) {
      return Promise.reject(serviceError(412));
    }
    if (!(command instanceof GetObjectCommand)) {
      return Promise.reject(new Error("Unexpected command"));
    }
    return Promise.resolve({
      $metadata: {},
      Body: streamed(new Uint8Array(payload.length)),
      ContentLength: payload.length,
    });
  });
  await expect(
    r2Store(credentials).putIfAbsent("object", payload)
  ).rejects.toThrow("Immutable object conflict");
  expect(send).toHaveBeenCalledTimes(3);
  expect(send.mock.calls[2][0]).toBeInstanceOf(GetObjectCommand);
});

test("R2 reuse verifies metadata and never overwrites an existing conflict", async () => {
  send.mockImplementation(() =>
    Promise.resolve({
      $metadata: {},
      ContentLength: payload.length,
      Metadata: { sha256: "0".repeat(64) },
    })
  );
  await expect(
    r2Store(credentials).putIfAbsent("object", payload)
  ).rejects.toThrow("Immutable object conflict");
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
});

test("R2 downloads bound both declared size and actual streamed bytes", async () => {
  send.mockImplementation(() =>
    Promise.resolve({
      $metadata: {},
      ContentLength: payload.length,
      Body: streamed(payload),
    })
  );
  await expect(r2Store(credentials).get("object", 1)).rejects.toThrow(
    "Oversized"
  );
  send.mockImplementation(() =>
    Promise.resolve({
      $metadata: {},
      ContentLength: 1,
      Body: streamed(payload),
    })
  );
  await expect(r2Store(credentials).get("object", 1)).rejects.toThrow(
    "exceeds limit"
  );
});

test("R2 errors other than create-only conflicts propagate", async () => {
  send.mockImplementation((command) => {
    if (command instanceof HeadObjectCommand) {
      return Promise.reject(serviceError(404));
    }
    return Promise.reject(serviceError(403));
  });
  await expect(
    r2Store(credentials).putIfAbsent("object", payload)
  ).rejects.toBeInstanceOf(S3ServiceException);
  expect(send).toHaveBeenCalledTimes(2);
});
