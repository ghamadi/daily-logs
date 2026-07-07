'use client';

import type { ChatStatus, FileUIPart, SourceDocumentUIPart } from 'ai';
import { CornerDownLeftIcon, ImageIcon, Monitor, PlusIcon, SquareIcon, XIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import type {
  ChangeEvent,
  ChangeEventHandler,
  ClipboardEventHandler,
  ComponentProps,
  FormEvent,
  FormEventHandler,
  HTMLAttributes,
  KeyboardEventHandler,
  MouseEvent,
  PropsWithChildren,
  ReactNode,
  RefObject,
} from 'react';
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Command } from '@/components/ui/command';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { HoverCard } from '@/components/ui/hover-card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';
import { cn, composeCompoundComponent } from '@/lib/utils/components';

export const PromptInput = composeCompoundComponent(PromptInputRoot, {
  Body: PromptInputBody,
  Textarea: PromptInputTextarea,
  Header: PromptInputHeader,
  Footer: PromptInputFooter,
  Tools: PromptInputTools,
  Button: PromptInputButton,
  ActionMenu: PromptInputActionMenu,
  ActionMenuTrigger: PromptInputActionMenuTrigger,
  ActionMenuContent: PromptInputActionMenuContent,
  ActionMenuItem: PromptInputActionMenuItem,
  ActionAddAttachments: PromptInputActionAddAttachments,
  ActionAddScreenshot: PromptInputActionAddScreenshot,
  Submit: PromptInputSubmit,
  Select: PromptInputSelect,
  SelectTrigger: PromptInputSelectTrigger,
  SelectContent: PromptInputSelectContent,
  SelectItem: PromptInputSelectItem,
  SelectValue: PromptInputSelectValue,
  HoverCard: PromptInputHoverCard,
  HoverCardTrigger: PromptInputHoverCardTrigger,
  HoverCardContent: PromptInputHoverCardContent,
  TabsList: PromptInputTabsList,
  Tab: PromptInputTab,
  TabLabel: PromptInputTabLabel,
  TabBody: PromptInputTabBody,
  TabItem: PromptInputTabItem,
  Command: PromptInputCommand,
  CommandInput: PromptInputCommandInput,
  CommandList: PromptInputCommandList,
  CommandEmpty: PromptInputCommandEmpty,
  CommandGroup: PromptInputCommandGroup,
  CommandItem: PromptInputCommandItem,
  CommandSeparator: PromptInputCommandSeparator,
});

// ------------------------------------------------------------
// Controller context & types
// ------------------------------------------------------------

export type AttachmentsContext = {
  files: (FileUIPart & { id: string })[];
  add: (files: File[] | FileList) => void;
  remove: (id: string) => void;
  clear: () => void;
  openFileDialog: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
};

export type TextInputContext = {
  value: string;
  setInput: (v: string) => void;
  clear: () => void;
};

export type PromptInputControllerProps = {
  textInput: TextInputContext;
  attachments: AttachmentsContext;
  /** INTERNAL: Allows PromptInput to register its file textInput + "open" callback */
  __registerFileInput: (ref: RefObject<HTMLInputElement | null>, open: () => void) => void;
};

const PromptInputController = createContext<PromptInputControllerProps | null>(null);
const ProviderAttachmentsContext = createContext<AttachmentsContext | null>(null);

export function usePromptInputController() {
  const ctx = useContext(PromptInputController);
  if (!ctx) {
    throw new Error(
      'Wrap your component inside <PromptInputProvider> to use usePromptInputController().',
    );
  }
  return ctx;
}

// Optional variant (does NOT throw). Useful for dual-mode components.
function useOptionalPromptInputController() {
  return useContext(PromptInputController);
}

export function useProviderAttachments() {
  const ctx = useContext(ProviderAttachmentsContext);
  if (!ctx) {
    throw new Error(
      'Wrap your component inside <PromptInputProvider> to use useProviderAttachments().',
    );
  }
  return ctx;
}

function useOptionalProviderAttachments() {
  return useContext(ProviderAttachmentsContext);
}

// ------------------------------------------------------------
// PromptInputProvider
// ------------------------------------------------------------

export type PromptInputProviderProps = PropsWithChildren<{
  initialInput?: string;
}>;

/**
 * Optional global provider that lifts PromptInput state outside of PromptInput.
 * If you don't use it, PromptInput stays fully self-managed.
 */
export function PromptInputProvider(props: PromptInputProviderProps) {
  const { initialInput: initialTextInput = '', children } = props;

  // ----- textInput state
  const [textInput, setTextInput] = useState(initialTextInput);
  const clearInput = useCallback(() => setTextInput(''), []);

  // ----- attachments state (global when wrapped)
  const [attachmentFiles, setAttachmentFiles] = useState<(FileUIPart & { id: string })[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const openRef = useRef<() => void>(() => {});

  const add = useCallback((files: File[] | FileList) => {
    const incoming = [...files];
    if (incoming.length === 0) {
      return;
    }

    setAttachmentFiles((prev) => [
      ...prev,
      ...incoming.map((file) => ({
        filename: file.name,
        id: nanoid(),
        mediaType: file.type,
        type: 'file' as const,
        url: URL.createObjectURL(file),
      })),
    ]);
  }, []);

  const remove = useCallback((id: string) => {
    setAttachmentFiles((prev) => {
      const found = prev.find((f) => f.id === id);
      if (found?.url) {
        URL.revokeObjectURL(found.url);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setAttachmentFiles((prev) => {
      for (const f of prev) {
        if (f.url) {
          URL.revokeObjectURL(f.url);
        }
      }
      return [];
    });
  }, []);

  // Keep a ref to attachments for cleanup on unmount (avoids stale closure)
  const attachmentsRef = useRef(attachmentFiles);

  useEffect(() => {
    attachmentsRef.current = attachmentFiles;
  }, [attachmentFiles]);

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(
    () => () => {
      for (const f of attachmentsRef.current) {
        if (f.url) {
          URL.revokeObjectURL(f.url);
        }
      }
    },
    [],
  );

  const openFileDialog = useCallback(() => {
    openRef.current?.();
  }, []);

  const attachments = useMemo<AttachmentsContext>(
    () => ({
      add,
      clear,
      fileInputRef,
      files: attachmentFiles,
      openFileDialog,
      remove,
    }),
    [attachmentFiles, add, remove, clear, openFileDialog],
  );

  const __registerFileInput = useCallback(
    (ref: RefObject<HTMLInputElement | null>, open: () => void) => {
      fileInputRef.current = ref.current;
      openRef.current = open;
    },
    [],
  );

  const controller = useMemo<PromptInputControllerProps>(
    () => ({
      __registerFileInput,
      attachments,
      textInput: {
        clear: clearInput,
        setInput: setTextInput,
        value: textInput,
      },
    }),
    [textInput, clearInput, attachments, __registerFileInput],
  );

  return (
    <PromptInputController.Provider value={controller}>
      <ProviderAttachmentsContext.Provider value={attachments}>
        {children}
      </ProviderAttachmentsContext.Provider>
    </PromptInputController.Provider>
  );
}

// ------------------------------------------------------------
// usePromptInputAttachments
// ------------------------------------------------------------

const LocalAttachmentsContext = createContext<AttachmentsContext | null>(null);

export function usePromptInputAttachments() {
  // Prefer local context (inside PromptInput) as it has validation, fall back to provider
  const provider = useOptionalProviderAttachments();
  const local = useContext(LocalAttachmentsContext);
  const context = local ?? provider;
  if (!context) {
    throw new Error(
      'usePromptInputAttachments must be used within a PromptInput or PromptInputProvider',
    );
  }
  return context;
}

// ------------------------------------------------------------
// usePromptInputReferencedSources
// ------------------------------------------------------------

export type ReferencedSourcesContext = {
  sources: (SourceDocumentUIPart & { id: string })[];
  add: (sources: SourceDocumentUIPart[] | SourceDocumentUIPart) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const LocalReferencedSourcesContext = createContext<ReferencedSourcesContext | null>(null);

export function usePromptInputReferencedSources() {
  const ctx = useContext(LocalReferencedSourcesContext);
  if (!ctx) {
    throw new Error(
      'usePromptInputReferencedSources must be used within a PromptInput',
    );
  }
  return ctx;
}

// ------------------------------------------------------------
// PromptInputActionAddAttachments
// ------------------------------------------------------------

export type PromptInputActionAddAttachmentsProps = ComponentProps<typeof DropdownMenu.Item> & {
  label?: string;
};

function PromptInputActionAddAttachments(props: PromptInputActionAddAttachmentsProps) {
  const { label = 'Add photos or files', ...rest } = props;
  const attachments = usePromptInputAttachments();

  const handleSelect = useCallback(
    (e: Event) => {
      e.preventDefault();
      attachments.openFileDialog();
    },
    [attachments],
  );

  return (
    <DropdownMenu.Item {...rest} onSelect={handleSelect}>
      <ImageIcon className="mr-2 size-4" /> {label}
    </DropdownMenu.Item>
  );
}

// ------------------------------------------------------------
// PromptInputActionAddScreenshot
// ------------------------------------------------------------

export type PromptInputActionAddScreenshotProps = ComponentProps<typeof DropdownMenu.Item> & {
  label?: string;
};

function PromptInputActionAddScreenshot(props: PromptInputActionAddScreenshotProps) {
  const { label = 'Take screenshot', onSelect, ...rest } = props;
  const attachments = usePromptInputAttachments();

  const handleSelect = useCallback(
    async (event: Event) => {
      onSelect?.(event);
      if (event.defaultPrevented) {
        return;
      }

      try {
        const screenshot = await captureScreenshot();
        if (screenshot) {
          attachments.add([screenshot]);
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          (error.name === 'NotAllowedError' || error.name === 'AbortError')
        ) {
          return;
        }
        throw error;
      }
    },
    [onSelect, attachments],
  );

  return (
    <DropdownMenu.Item {...rest} onSelect={handleSelect}>
      <Monitor className="mr-2 size-4" />
      {label}
    </DropdownMenu.Item>
  );
}

// ------------------------------------------------------------
// PromptInputRoot
// ------------------------------------------------------------

export type PromptInputMessage = {
  text: string;
  files: FileUIPart[];
};

export type PromptInputProps = Omit<HTMLAttributes<HTMLFormElement>, 'onSubmit' | 'onError'> & {
  // e.g., "image/*" or leave undefined for any
  accept?: string;
  multiple?: boolean;
  // When true, accepts drops anywhere on document. Default false (opt-in).
  globalDrop?: boolean;
  // Render a hidden input with given name and keep it in sync for native form posts. Default false.
  syncHiddenInput?: boolean;
  // Minimal constraints
  maxFiles?: number;
  // bytes
  maxFileSize?: number;
  onError?: (err: {
    code: 'max_files' | 'max_file_size' | 'accept';
    message: string;
  }) => void;
  onSubmit: (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

function PromptInputRoot(props: PromptInputProps) {
  const {
    className,
    accept,
    multiple,
    globalDrop,
    syncHiddenInput,
    maxFiles,
    maxFileSize,
    onError,
    onSubmit,
    children,
    ...rest
  } = props;

  // Try to use a provider controller if present
  const controller = useOptionalPromptInputController();
  const usingProvider = !!controller;

  // Refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // ----- Local attachments (only used when no provider)
  const [items, setItems] = useState<(FileUIPart & { id: string })[]>([]);
  const files = usingProvider ? controller.attachments.files : items;

  // ----- Local referenced sources (always local to PromptInput)
  const [referencedSources, setReferencedSources] = useState<
    (SourceDocumentUIPart & { id: string })[]
  >([]);

  // Keep a ref to files for cleanup on unmount (avoids stale closure)
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const openFileDialogLocal = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const matchesAccept = useCallback(
    (f: File) => {
      if (!accept || accept.trim() === '') {
        return true;
      }

      const patterns = accept
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      return patterns.some((pattern) => {
        if (pattern.endsWith('/*')) {
          // e.g: image/* -> image/
          const prefix = pattern.slice(0, -1);
          return f.type.startsWith(prefix);
        }
        return f.type === pattern;
      });
    },
    [accept],
  );

  const addLocal = useCallback(
    (fileList: File[] | FileList) => {
      const incoming = [...fileList];
      const accepted = incoming.filter((f) => matchesAccept(f));
      if (incoming.length && accepted.length === 0) {
        onError?.({
          code: 'accept',
          message: 'No files match the accepted types.',
        });
        return;
      }
      const withinSize = (f: File) => (maxFileSize ? f.size <= maxFileSize : true);
      const sized = accepted.filter(withinSize);
      if (accepted.length > 0 && sized.length === 0) {
        onError?.({
          code: 'max_file_size',
          message: 'All files exceed the maximum size.',
        });
        return;
      }

      setItems((prev) => {
        const capacity =
          typeof maxFiles === 'number' ? Math.max(0, maxFiles - prev.length) : undefined;
        const capped = typeof capacity === 'number' ? sized.slice(0, capacity) : sized;
        if (typeof capacity === 'number' && sized.length > capacity) {
          onError?.({
            code: 'max_files',
            message: 'Too many files. Some were not added.',
          });
        }
        const next: (FileUIPart & { id: string })[] = [];
        for (const file of capped) {
          next.push({
            filename: file.name,
            id: nanoid(),
            mediaType: file.type,
            type: 'file',
            url: URL.createObjectURL(file),
          });
        }
        return [...prev, ...next];
      });
    },
    [matchesAccept, maxFiles, maxFileSize, onError],
  );

  const removeLocal = useCallback(
    (id: string) =>
      setItems((prev) => {
        const found = prev.find((file) => file.id === id);
        if (found?.url) {
          URL.revokeObjectURL(found.url);
        }
        return prev.filter((file) => file.id !== id);
      }),
    [],
  );

  // Wrapper that validates files before calling provider's add
  const addWithProviderValidation = useCallback(
    (fileList: File[] | FileList) => {
      const incoming = [...fileList];
      const accepted = incoming.filter((f) => matchesAccept(f));
      if (incoming.length && accepted.length === 0) {
        onError?.({
          code: 'accept',
          message: 'No files match the accepted types.',
        });
        return;
      }
      const withinSize = (f: File) => (maxFileSize ? f.size <= maxFileSize : true);
      const sized = accepted.filter(withinSize);
      if (accepted.length > 0 && sized.length === 0) {
        onError?.({
          code: 'max_file_size',
          message: 'All files exceed the maximum size.',
        });
        return;
      }

      const currentCount = files.length;
      const capacity =
        typeof maxFiles === 'number' ? Math.max(0, maxFiles - currentCount) : undefined;
      const capped = typeof capacity === 'number' ? sized.slice(0, capacity) : sized;
      if (typeof capacity === 'number' && sized.length > capacity) {
        onError?.({
          code: 'max_files',
          message: 'Too many files. Some were not added.',
        });
      }

      if (capped.length > 0) {
        controller?.attachments.add(capped);
      }
    },
    [matchesAccept, maxFileSize, maxFiles, onError, files.length, controller],
  );

  const clearAttachments = useCallback(
    () =>
      usingProvider
        ? controller?.attachments.clear()
        : setItems((prev) => {
            for (const file of prev) {
              if (file.url) {
                URL.revokeObjectURL(file.url);
              }
            }
            return [];
          }),
    [usingProvider, controller],
  );

  const clearReferencedSources = useCallback(() => setReferencedSources([]), []);

  const add = usingProvider ? addWithProviderValidation : addLocal;
  const remove = usingProvider ? controller.attachments.remove : removeLocal;
  const openFileDialog = usingProvider
    ? controller.attachments.openFileDialog
    : openFileDialogLocal;

  const clear = useCallback(() => {
    clearAttachments();
    clearReferencedSources();
  }, [clearAttachments, clearReferencedSources]);

  // Let provider know about our hidden file input so external menus can call openFileDialog()
  useEffect(() => {
    if (!usingProvider) {
      return;
    }
    controller.__registerFileInput(inputRef, () => inputRef.current?.click());
  }, [usingProvider, controller]);

  // Note: File input cannot be programmatically set for security reasons
  // The syncHiddenInput prop is no longer functional
  useEffect(() => {
    if (syncHiddenInput && inputRef.current && files.length === 0) {
      inputRef.current.value = '';
    }
  }, [files, syncHiddenInput]);

  // Attach drop handlers on nearest form and document (opt-in)
  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }
    if (globalDrop) {
      // when global drop is on, let the document-level handler own drops
      return;
    }

    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
      }
    };
    const onDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
      }
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        add(e.dataTransfer.files);
      }
    };
    form.addEventListener('dragover', onDragOver);
    form.addEventListener('drop', onDrop);
    return () => {
      form.removeEventListener('dragover', onDragOver);
      form.removeEventListener('drop', onDrop);
    };
  }, [add, globalDrop]);

  useEffect(() => {
    if (!globalDrop) {
      return;
    }

    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
      }
    };
    const onDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
      }
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        add(e.dataTransfer.files);
      }
    };
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [add, globalDrop]);

  useEffect(
    () => () => {
      if (!usingProvider) {
        for (const f of filesRef.current) {
          if (f.url) {
            URL.revokeObjectURL(f.url);
          }
        }
      }
    },
    [usingProvider],
  );

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (event.currentTarget.files) {
        add(event.currentTarget.files);
      }
      // Reset input value to allow selecting files that were previously removed
      event.currentTarget.value = '';
    },
    [add],
  );

  const attachmentsCtx = useMemo<AttachmentsContext>(
    () => ({
      add,
      clear: clearAttachments,
      fileInputRef: inputRef,
      files: files.map((item) => ({ ...item, id: item.id })),
      openFileDialog,
      remove,
    }),
    [files, add, remove, clearAttachments, openFileDialog],
  );

  const refsCtx = useMemo<ReferencedSourcesContext>(
    () => ({
      add: (incoming: SourceDocumentUIPart[] | SourceDocumentUIPart) => {
        const array = Array.isArray(incoming) ? incoming : [incoming];
        setReferencedSources((prev) => [...prev, ...array.map((s) => ({ ...s, id: nanoid() }))]);
      },
      clear: clearReferencedSources,
      remove: (id: string) => {
        setReferencedSources((prev) => prev.filter((s) => s.id !== id));
      },
      sources: referencedSources,
    }),
    [referencedSources, clearReferencedSources],
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event.preventDefault();

      const form = event.currentTarget;
      const text = usingProvider
        ? controller.textInput.value
        : (() => {
            const formData = new FormData(form);
            return (formData.get('message') as string) || '';
          })();

      // Reset form immediately after capturing text to avoid race condition
      // where user input during async blob conversion would be lost
      if (!usingProvider) {
        form.reset();
      }

      try {
        // Convert blob URLs to data URLs asynchronously
        const convertedFiles: FileUIPart[] = await Promise.all(
          files.map(async ({ id: _id, ...item }) => {
            if (item.url?.startsWith('blob:')) {
              const dataUrl = await convertBlobUrlToDataUrl(item.url);
              // If conversion failed, keep the original blob URL
              return {
                ...item,
                url: dataUrl ?? item.url,
              };
            }
            return item;
          }),
        );

        const result = onSubmit({ files: convertedFiles, text }, event);

        // Handle both sync and async onSubmit
        if (result instanceof Promise) {
          try {
            await result;
            clear();
            if (usingProvider) {
              controller.textInput.clear();
            }
          } catch {
            // Don't clear on error - user may want to retry
          }
        } else {
          // Sync function completed without throwing, clear inputs
          clear();
          if (usingProvider) {
            controller.textInput.clear();
          }
        }
      } catch {
        // Don't clear on error - user may want to retry
      }
    },
    [usingProvider, controller, files, onSubmit, clear],
  );

  // Render with or without local provider
  const inner = (
    <>
      <input
        accept={accept}
        aria-label="Upload files"
        className="hidden"
        multiple={multiple}
        onChange={handleChange}
        ref={inputRef}
        title="Upload files"
        type="file"
      />
      <form className={cn('w-full', className)} onSubmit={handleSubmit} ref={formRef} {...rest}>
        <InputGroup className="overflow-hidden">{children}</InputGroup>
      </form>
    </>
  );

  const withReferencedSources = (
    <LocalReferencedSourcesContext.Provider value={refsCtx}>
      {inner}
    </LocalReferencedSourcesContext.Provider>
  );

  // Always provide LocalAttachmentsContext so children get validated add function
  return (
    <LocalAttachmentsContext.Provider value={attachmentsCtx}>
      {withReferencedSources}
    </LocalAttachmentsContext.Provider>
  );
}

// ------------------------------------------------------------
// PromptInputBody
// ------------------------------------------------------------

export type PromptInputBodyProps = HTMLAttributes<HTMLDivElement>;

function PromptInputBody(props: PromptInputBodyProps) {
  const { className, ...rest } = props;
  return <div className={cn('contents', className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputTextarea
// ------------------------------------------------------------

export type PromptInputTextareaProps = ComponentProps<typeof InputGroupTextarea>;

function PromptInputTextarea(props: PromptInputTextareaProps) {
  const {
    onChange,
    onKeyDown,
    className,
    placeholder = 'What would you like to know?',
    ...rest
  } = props;
  const controller = useOptionalPromptInputController();
  const attachments = usePromptInputAttachments();
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (e) => {
      // Call the external onKeyDown handler first
      onKeyDown?.(e);

      // If the external handler prevented default, don't run internal logic
      if (e.defaultPrevented) {
        return;
      }

      if (e.key === 'Enter') {
        if (isComposing || e.nativeEvent.isComposing) {
          return;
        }
        if (e.shiftKey) {
          return;
        }
        e.preventDefault();

        // Check if the submit button is disabled before submitting
        const { form } = e.currentTarget;
        const submitButton = form?.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement | null;
        if (submitButton?.disabled) {
          return;
        }

        form?.requestSubmit();
      }

      // Remove last attachment when Backspace is pressed and textarea is empty
      if (e.key === 'Backspace' && e.currentTarget.value === '' && attachments.files.length > 0) {
        e.preventDefault();
        const lastAttachment = attachments.files.at(-1);
        if (lastAttachment) {
          attachments.remove(lastAttachment.id);
        }
      }
    },
    [onKeyDown, isComposing, attachments],
  );

  const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      const items = event.clipboardData?.items;

      if (!items) {
        return;
      }

      const files: File[] = [];

      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        event.preventDefault();
        attachments.add(files);
      }
    },
    [attachments],
  );

  const handleCompositionEnd = useCallback(() => setIsComposing(false), []);
  const handleCompositionStart = useCallback(() => setIsComposing(true), []);

  const controlledProps = controller
    ? {
        onChange: (e: ChangeEvent<HTMLTextAreaElement>) => {
          controller.textInput.setInput(e.currentTarget.value);
          onChange?.(e);
        },
        value: controller.textInput.value,
      }
    : {
        onChange,
      };

  return (
    <InputGroupTextarea
      className={cn('field-sizing-content max-h-48 min-h-16', className)}
      name="message"
      onCompositionEnd={handleCompositionEnd}
      onCompositionStart={handleCompositionStart}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      {...rest}
      {...controlledProps}
    />
  );
}

// ------------------------------------------------------------
// PromptInputHeader
// ------------------------------------------------------------

export type PromptInputHeaderProps = Omit<ComponentProps<typeof InputGroupAddon>, 'align'>;

function PromptInputHeader(props: PromptInputHeaderProps) {
  const { className, ...rest } = props;
  return (
    <InputGroupAddon
      align="block-end"
      className={cn('order-first flex-wrap gap-1', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// PromptInputFooter
// ------------------------------------------------------------

export type PromptInputFooterProps = Omit<ComponentProps<typeof InputGroupAddon>, 'align'>;

function PromptInputFooter(props: PromptInputFooterProps) {
  const { className, ...rest } = props;
  return (
    <InputGroupAddon align="block-end" className={cn('justify-between gap-1', className)} {...rest} />
  );
}

// ------------------------------------------------------------
// PromptInputTools
// ------------------------------------------------------------

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

function PromptInputTools(props: PromptInputToolsProps) {
  const { className, ...rest } = props;
  return <div className={cn('flex min-w-0 items-center gap-1', className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputButton
// ------------------------------------------------------------

export type PromptInputButtonTooltip =
  | string
  | {
      content: ReactNode;
      shortcut?: string;
      side?: ComponentProps<typeof Tooltip.Content>['side'];
    };

export type PromptInputButtonProps = ComponentProps<typeof InputGroupButton> & {
  tooltip?: PromptInputButtonTooltip;
};

function PromptInputButton(props: PromptInputButtonProps) {
  const { variant = 'ghost', className, size, tooltip, ...rest } = props;

  const newSize = size ?? (Children.count(rest.children) > 1 ? 'sm' : 'icon-sm');

  const button = (
    <InputGroupButton
      className={cn(className)}
      size={newSize}
      type="button"
      variant={variant}
      {...rest}
    />
  );

  if (!tooltip) {
    return button;
  }

  const tooltipContent = typeof tooltip === 'string' ? tooltip : tooltip.content;
  const shortcut = typeof tooltip === 'string' ? undefined : tooltip.shortcut;
  const side = typeof tooltip === 'string' ? 'top' : (tooltip.side ?? 'top');

  return (
    <Tooltip>
      <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
      <Tooltip.Content side={side}>
        {tooltipContent}
        {shortcut && <span className="ml-2 text-muted-foreground">{shortcut}</span>}
      </Tooltip.Content>
    </Tooltip>
  );
}

// ------------------------------------------------------------
// PromptInputActionMenu
// ------------------------------------------------------------

export type PromptInputActionMenuProps = ComponentProps<typeof DropdownMenu>;

function PromptInputActionMenu(props: PromptInputActionMenuProps) {
  return <DropdownMenu {...props} />;
}

// ------------------------------------------------------------
// PromptInputActionMenuTrigger
// ------------------------------------------------------------

export type PromptInputActionMenuTriggerProps = PromptInputButtonProps;

function PromptInputActionMenuTrigger(props: PromptInputActionMenuTriggerProps) {
  const { className, children, ...rest } = props;
  return (
    <DropdownMenu.Trigger asChild>
      <PromptInputButton className={className} {...rest}>
        {children ?? <PlusIcon className="size-4" />}
      </PromptInputButton>
    </DropdownMenu.Trigger>
  );
}

// ------------------------------------------------------------
// PromptInputActionMenuContent
// ------------------------------------------------------------

export type PromptInputActionMenuContentProps = ComponentProps<typeof DropdownMenu.Content>;

function PromptInputActionMenuContent(props: PromptInputActionMenuContentProps) {
  const { className, ...rest } = props;
  return <DropdownMenu.Content align="start" className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputActionMenuItem
// ------------------------------------------------------------

export type PromptInputActionMenuItemProps = ComponentProps<typeof DropdownMenu.Item>;

function PromptInputActionMenuItem(props: PromptInputActionMenuItemProps) {
  const { className, ...rest } = props;
  return <DropdownMenu.Item className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputSubmit
// ------------------------------------------------------------

export type PromptInputSubmitProps = ComponentProps<typeof InputGroupButton> & {
  status?: ChatStatus;
  onStop?: () => void;
};

function PromptInputSubmit(props: PromptInputSubmitProps) {
  const {
    className,
    variant = 'default',
    size = 'icon-sm',
    status,
    onStop,
    onClick,
    children,
    ...rest
  } = props;
  const isGenerating = status === 'submitted' || status === 'streaming';

  let Icon = <CornerDownLeftIcon className="size-4" />;

  if (status === 'submitted') {
    Icon = <Spinner />;
  } else if (status === 'streaming') {
    Icon = <SquareIcon className="size-4" />;
  } else if (status === 'error') {
    Icon = <XIcon className="size-4" />;
  }

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (isGenerating && onStop) {
        e.preventDefault();
        onStop();
        return;
      }
      onClick?.(e);
    },
    [isGenerating, onStop, onClick],
  );

  return (
    <InputGroupButton
      aria-label={isGenerating ? 'Stop' : 'Submit'}
      className={cn(className)}
      onClick={handleClick}
      size={size}
      type={isGenerating && onStop ? 'button' : 'submit'}
      variant={variant}
      {...rest}
    >
      {children ?? Icon}
    </InputGroupButton>
  );
}

// ------------------------------------------------------------
// PromptInputSelect
// ------------------------------------------------------------

export type PromptInputSelectProps = ComponentProps<typeof Select>;

function PromptInputSelect(props: PromptInputSelectProps) {
  return <Select {...props} />;
}

// ------------------------------------------------------------
// PromptInputSelectTrigger
// ------------------------------------------------------------

export type PromptInputSelectTriggerProps = ComponentProps<typeof Select.Trigger>;

function PromptInputSelectTrigger(props: PromptInputSelectTriggerProps) {
  const { className, ...rest } = props;
  return (
    <Select.Trigger
      className={cn(
        'border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors',
        'hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// PromptInputSelectContent
// ------------------------------------------------------------

export type PromptInputSelectContentProps = ComponentProps<typeof Select.Content>;

function PromptInputSelectContent(props: PromptInputSelectContentProps) {
  const { className, ...rest } = props;
  return <Select.Content className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputSelectItem
// ------------------------------------------------------------

export type PromptInputSelectItemProps = ComponentProps<typeof Select.Item>;

function PromptInputSelectItem(props: PromptInputSelectItemProps) {
  const { className, ...rest } = props;
  return <Select.Item className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputSelectValue
// ------------------------------------------------------------

export type PromptInputSelectValueProps = ComponentProps<typeof Select.Value>;

function PromptInputSelectValue(props: PromptInputSelectValueProps) {
  const { className, ...rest } = props;
  return <Select.Value className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputHoverCard
// ------------------------------------------------------------

export type PromptInputHoverCardProps = ComponentProps<typeof HoverCard>;

function PromptInputHoverCard(props: PromptInputHoverCardProps) {
  const { openDelay = 0, closeDelay = 0, ...rest } = props;
  return <HoverCard closeDelay={closeDelay} openDelay={openDelay} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputHoverCardTrigger
// ------------------------------------------------------------

export type PromptInputHoverCardTriggerProps = ComponentProps<typeof HoverCard.Trigger>;

function PromptInputHoverCardTrigger(props: PromptInputHoverCardTriggerProps) {
  return <HoverCard.Trigger {...props} />;
}

// ------------------------------------------------------------
// PromptInputHoverCardContent
// ------------------------------------------------------------

export type PromptInputHoverCardContentProps = ComponentProps<typeof HoverCard.Content>;

function PromptInputHoverCardContent(props: PromptInputHoverCardContentProps) {
  const { align = 'start', ...rest } = props;
  return <HoverCard.Content align={align} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputTabsList
// ------------------------------------------------------------

export type PromptInputTabsListProps = HTMLAttributes<HTMLDivElement>;

function PromptInputTabsList(props: PromptInputTabsListProps) {
  const { className, ...rest } = props;
  return <div className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputTab
// ------------------------------------------------------------

export type PromptInputTabProps = HTMLAttributes<HTMLDivElement>;

function PromptInputTab(props: PromptInputTabProps) {
  const { className, ...rest } = props;
  return <div className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputTabLabel
// ------------------------------------------------------------

export type PromptInputTabLabelProps = HTMLAttributes<HTMLHeadingElement>;

function PromptInputTabLabel(props: PromptInputTabLabelProps) {
  const { className, ...rest } = props;
  // Content is provided via children in props
  return (
    <h3 className={cn('mb-2 px-3 font-medium text-muted-foreground text-xs', className)} {...rest} />
  );
}

// ------------------------------------------------------------
// PromptInputTabBody
// ------------------------------------------------------------

export type PromptInputTabBodyProps = HTMLAttributes<HTMLDivElement>;

function PromptInputTabBody(props: PromptInputTabBodyProps) {
  const { className, ...rest } = props;
  return <div className={cn('space-y-1', className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputTabItem
// ------------------------------------------------------------

export type PromptInputTabItemProps = HTMLAttributes<HTMLDivElement>;

function PromptInputTabItem(props: PromptInputTabItemProps) {
  const { className, ...rest } = props;
  return (
    <div
      className={cn('flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// PromptInputCommand
// ------------------------------------------------------------

export type PromptInputCommandProps = ComponentProps<typeof Command>;

function PromptInputCommand(props: PromptInputCommandProps) {
  const { className, ...rest } = props;
  return <Command className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputCommandInput
// ------------------------------------------------------------

export type PromptInputCommandInputProps = ComponentProps<typeof Command.Input>;

function PromptInputCommandInput(props: PromptInputCommandInputProps) {
  const { className, ...rest } = props;
  return <Command.Input className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputCommandList
// ------------------------------------------------------------

export type PromptInputCommandListProps = ComponentProps<typeof Command.List>;

function PromptInputCommandList(props: PromptInputCommandListProps) {
  const { className, ...rest } = props;
  return <Command.List className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputCommandEmpty
// ------------------------------------------------------------

export type PromptInputCommandEmptyProps = ComponentProps<typeof Command.Empty>;

function PromptInputCommandEmpty(props: PromptInputCommandEmptyProps) {
  const { className, ...rest } = props;
  return <Command.Empty className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputCommandGroup
// ------------------------------------------------------------

export type PromptInputCommandGroupProps = ComponentProps<typeof Command.Group>;

function PromptInputCommandGroup(props: PromptInputCommandGroupProps) {
  const { className, ...rest } = props;
  return <Command.Group className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputCommandItem
// ------------------------------------------------------------

export type PromptInputCommandItemProps = ComponentProps<typeof Command.Item>;

function PromptInputCommandItem(props: PromptInputCommandItemProps) {
  const { className, ...rest } = props;
  return <Command.Item className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// PromptInputCommandSeparator
// ------------------------------------------------------------

export type PromptInputCommandSeparatorProps = ComponentProps<typeof Command.Separator>;

function PromptInputCommandSeparator(props: PromptInputCommandSeparatorProps) {
  const { className, ...rest } = props;
  return <Command.Separator className={cn(className)} {...rest} />;
}

// ------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------

async function convertBlobUrlToDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    // FileReader uses a callback API, so wrap it in a Promise.
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function captureScreenshot(): Promise<File | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
    return null;
  }

  let stream: MediaStream | null = null;
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;

  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      audio: false,
      video: true,
    });

    video.srcObject = stream;

    // The video element uses a callback API, so wrap it in a Promise.
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load screen stream'));
    });

    await video.play();

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    context.drawImage(video, 0, 0, width, height);
    // canvas.toBlob uses a callback API, so wrap it in a Promise.
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
    if (!blob) {
      return null;
    }

    const timestamp = new Date()
      .toISOString()
      .replaceAll(/[:.]/g, '-')
      .replace('T', '_')
      .replace('Z', '');

    return new File([blob], `screenshot-${timestamp}.png`, {
      lastModified: Date.now(),
      type: 'image/png',
    });
  } finally {
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
    video.pause();
    video.srcObject = null;
  }
}
