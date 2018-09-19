// @flow
import child_process from "child_process";
import { Readable } from "readable-stream";
import get from "lodash/get";
import AbstractCLI from "./";

jest.mock("child_process");

function buildOptions(options: *) {
  return {
    abstractToken: "1",
    ...options
  };
}

function buildTextStream(text?: string): ReadableStream {
  const stream = new Readable();
  stream._read = () => {}; // required

  if (text !== undefined) {
    stream.push(text);
    stream.push(null); // end of stream
  }

  return stream;
}

const MOCK_PROJECT_DESCRIPTOR = {
  projectId: "project-id"
};

const MOCK_COMMIT_DESCRIPTOR = {
  projectId: "project-id",
  branchId: "branch-id",
  sha: "commit-sha"
};

const MOCK_BRANCH_DESCRIPTOR = {
  projectId: "project-id",
  branchId: "branch-id"
};

const MOCK_FILE_DESCRIPTOR = {
  projectId: "project-id",
  branchId: "branch-id",
  fileId: "file-id"
};

const MOCK_LAYER_DESCRIPTOR = {
  projectId: "project-id",
  branchId: "branch-id",
  fileId: "file-id",
  layerId: "layer-id"
};

const MOCK_COLLECTION_DESCRIPTOR = {
  projectId: "project-id",
  branchId: "branch-id",
  collectionId: "collection-id"
};

describe(AbstractCLI, () => {
  test("throws when abstract-cli cannot be located", () => {
    expect(
      () =>
        new AbstractCLI(
          buildOptions({
            abstractCliPath: ["./fixtures/missing/abstract-cli"]
          })
        ).abstractCliPath
    ).toThrow('Cannot find abstract-cli in "./fixtures/missing/abstract-cli"');
  });

  describe("without module cache to reset process.env", () => {
    beforeEach(() => {
      jest.resetModules();
    });

    test.each([
      [
        // Relative path
        "./fixtures/abstract-cli",
        "fixtures/abstract-cli"
      ],
      [
        // Ignores misssing abstract-cli path
        "/missing/abstract-cli:./fixtures/abstract-cli",
        "fixtures/abstract-cli"
      ],
      [
        // Prefers first matched abstract-cli path
        "./fixtures/other/abstract-cli/:fixtures/abstract-cli",
        "fixtures/other/abstract-cli"
      ]
    ])(
      "configures options.abstractCliPath from process.env.ABSTRACT_CLI_PATH=%p",
      (abstractCliPath, expected) => {
        process.env.ABSTRACT_CLI_PATH = abstractCliPath;
        const { default: AbstractCLI } = require("./");
        expect(new AbstractCLI(buildOptions()).abstractCliPath).toBe(expected);
      }
    );

    test("prefers options.abstractCliPath=%p over process.env.ABSTRACT_CLI_PATH", () => {
      process.env.ABSTRACT_CLI_PATH = "./fixtures/other/abstract-cli";
      const { default: AbstractCLI } = require("./");
      expect(
        new AbstractCLI(
          buildOptions({
            abstractCliPath: ["./fixtures/abstract-cli"]
          })
        ).abstractCliPath
      ).toBe("fixtures/abstract-cli");
    });
  });

  describe("with mocked child_process.spawn", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test.each([
      ["commits.list", MOCK_BRANCH_DESCRIPTOR],
      ["commits.list", MOCK_FILE_DESCRIPTOR],
      ["commits.list", MOCK_LAYER_DESCRIPTOR],
      ["commits.info", MOCK_BRANCH_DESCRIPTOR],
      ["commits.info", MOCK_FILE_DESCRIPTOR],
      ["commits.info", MOCK_LAYER_DESCRIPTOR],
      ["commits.list", { ...MOCK_BRANCH_DESCRIPTOR, sha: "commit-sha" }],
      ["commits.list", { ...MOCK_FILE_DESCRIPTOR, sha: "commit-sha" }],
      ["commits.list", { ...MOCK_LAYER_DESCRIPTOR, sha: "commit-sha" }],
      ["commits.info", { ...MOCK_BRANCH_DESCRIPTOR, sha: "commit-sha" }],
      ["commits.info", { ...MOCK_FILE_DESCRIPTOR, sha: "commit-sha" }],
      ["commits.info", { ...MOCK_LAYER_DESCRIPTOR, sha: "commit-sha" }],
      ["files.list", MOCK_BRANCH_DESCRIPTOR],
      ["files.list", MOCK_COMMIT_DESCRIPTOR],
      ["files.info", MOCK_FILE_DESCRIPTOR],
      ["layers.list", MOCK_FILE_DESCRIPTOR],
      ["layers.data", MOCK_LAYER_DESCRIPTOR],
      ["layers.info", MOCK_LAYER_DESCRIPTOR],
      ["files.info", MOCK_FILE_DESCRIPTOR],
      ["collections.list", MOCK_PROJECT_DESCRIPTOR],
      ["collections.list", MOCK_BRANCH_DESCRIPTOR],
      ["collections.info", MOCK_COLLECTION_DESCRIPTOR]
    ])("%s(%p)", async (property, descriptor, options = {}) => {
      const transport = new AbstractCLI(
        buildOptions({
          abstractCliPath: ["./fixtures/abstract-cli"]
        })
      );

      const transportMethod = get(transport, property).bind(transport);

      child_process.spawn.mockReturnValueOnce({
        stdout: buildTextStream(options.stdout),
        stderr: buildTextStream(options.stderr),
        on: jest.fn().mockReturnThis()
      });

      await expect(transportMethod(descriptor)).resolves;
      expect(child_process.spawn.mock.calls).toMatchSnapshot();
    });
  });
});
