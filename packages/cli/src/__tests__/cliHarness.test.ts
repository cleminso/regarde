import { ArgParser } from "@alcyone-labs/arg-parser";
import { describe, expect, it } from "vitest";

describe("cli harness", () => {
  it("routes argv to the correct tool via ArgParser", async () => {
    const cli = new ArgParser({ appName: "Test", appCommandName: "test" });

    cli.addTool({
      name: "echo",
      description: "echo",
      flags: [
        {
          name: "value",
          type: "string",
          mandatory: true,
          options: ["--value"],
          description: "value",
        },
      ],
      outputSchema: "successWithData",
      handler: async (ctx) => {
        return { ok: true, command: "echo", data: { value: ctx.args.value } };
      },
    });

    const result = await cli.parse(["echo", "--value", "hello"]);
    expect(result.handlerResponse).toEqual({
      ok: true,
      command: "echo",
      data: { value: "hello" },
    });
  });
});
