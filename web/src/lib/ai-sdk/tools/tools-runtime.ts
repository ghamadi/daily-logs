import { UIMessageStreamWriter } from 'ai';

/**
 * A runtime for the chat tools.
 *
 * Factories building tools do not need to have access to the stream's writer.
 * Instead the factory accepts the runtime instance to expose its methods to the tool.
 * The tool can call `runtime.write` as long as we called `runtime.registerWriter` before tool invocation can occur.
 */
export class ToolsRuntime {
  private _writer: UIMessageStreamWriter | undefined;

  registerWriter(writer: UIMessageStreamWriter) {
    this._writer = writer;
    return () => (this._writer = undefined);
  }

  get writer() {
    if (!this._writer) {
      throw new Error('No writer found. Did you forget to call `registerWriter`?');
    }
    return this._writer;
  }
}
