// @flow
import type { AbstractInterface } from "../";
import { AUTO } from "../transports";

type Options = {
  abstractToken?: string,
  abstractCliPath?: string[],
  transport?: *,
  node?: {
    fs?: Object,
    child_process?: Object,
    buffer?: Object
  }
};

export default function Client({
  abstractToken = process.env.ABSTRACT_TOKEN || "",
  abstractCliPath,
  transport: Transport = AUTO,
  node
}: Options = {}): AbstractInterface {
  if (!abstractToken) {
    throw new Error("options.abstractToken or ABSTRACT_TOKEN required");
  }

  if (!Transport) {
    throw new Error("options.transport required");
  }

  return new Transport({ abstractToken, abstractCliPath, node });
}
