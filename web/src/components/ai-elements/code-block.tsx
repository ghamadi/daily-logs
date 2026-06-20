'use client';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import { CheckIcon, CopyIcon } from 'lucide-react';
import type { ComponentProps, CSSProperties } from 'react';
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { BundledLanguage, BundledTheme, HighlighterGeneric, ThemedToken } from 'shiki';
import { createHighlighter } from 'shiki';

export const CodeBlock = composeCompoundComponent(CodeBlockRoot, {
  Container: CodeBlockContainer,
  Header: CodeBlockHeader,
  Title: CodeBlockTitle,
  Filename: CodeBlockFilename,
  Actions: CodeBlockActions,
  Content: CodeBlockContent,
  CopyButton: CodeBlockCopyButton,
  LanguageSelector: CodeBlockLanguageSelector,
  LanguageSelectorTrigger: CodeBlockLanguageSelectorTrigger,
  LanguageSelectorValue: CodeBlockLanguageSelectorValue,
  LanguageSelectorContent: CodeBlockLanguageSelectorContent,
  LanguageSelectorItem: CodeBlockLanguageSelectorItem,
});

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: '',
});

const CodeBlockBody = memo(
  function CodeBlockBody(props: {
    tokenized: TokenizedCode;
    showLineNumbers: boolean;
    className?: string;
  }) {
    const { tokenized, showLineNumbers, className } = props;

    const preStyle = useMemo(
      () => ({
        backgroundColor: tokenized.bg,
        color: tokenized.fg,
      }),
      [tokenized.bg, tokenized.fg],
    );

    const keyedLines = useMemo(() => addKeysToTokens(tokenized.tokens), [tokenized.tokens]);

    return (
      <pre
        className={cn('m-0 p-4 text-sm dark:bg-(--shiki-dark-bg)! dark:text-(--shiki-dark)!', className)}
        style={preStyle}
      >
        <code
          className={cn(
            'font-mono text-sm',
            showLineNumbers && '[counter-increment:line_0] [counter-reset:line]',
          )}
        >
          {keyedLines.map((keyedLine) => (
            <LineSpan key={keyedLine.key} keyedLine={keyedLine} showLineNumbers={showLineNumbers} />
          ))}
        </code>
      </pre>
    );
  },
  (prevProps, nextProps) =>
    prevProps.tokenized === nextProps.tokenized &&
    prevProps.showLineNumbers === nextProps.showLineNumbers &&
    prevProps.className === nextProps.className,
);

CodeBlockBody.displayName = 'CodeBlockBody';

// ------------------------------------------------------------
// CodeBlockRoot
// ------------------------------------------------------------

export type CodeBlockProps = ComponentProps<'div'> & {
  code: string;
  language: BundledLanguage;
  showLineNumbers?: boolean;
};

function CodeBlockRoot(props: CodeBlockProps) {
  const { code, language, showLineNumbers = false, className, children, ...rest } = props;

  const contextValue = useMemo(() => ({ code }), [code]);

  return (
    <CodeBlockContext.Provider value={contextValue}>
      <CodeBlockContainer className={className} language={language} {...rest}>
        {children}
        <CodeBlockContent code={code} language={language} showLineNumbers={showLineNumbers} />
      </CodeBlockContainer>
    </CodeBlockContext.Provider>
  );
}

// ------------------------------------------------------------
// CodeBlockContainer
// ------------------------------------------------------------

export type CodeBlockContainerProps = ComponentProps<'div'> & {
  language: string;
};

function CodeBlockContainer(props: CodeBlockContainerProps) {
  const { className, language, style, ...rest } = props;
  return (
    <div
      data-slot="code-block-container"
      data-language={language}
      className={cn(
        'group bg-background text-foreground relative w-full overflow-hidden rounded-md border',
        className,
      )}
      style={{
        containIntrinsicSize: 'auto 200px',
        contentVisibility: 'auto',
        ...style,
      }}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// CodeBlockHeader
// ------------------------------------------------------------

export type CodeBlockHeaderProps = ComponentProps<'div'>;

function CodeBlockHeader(props: CodeBlockHeaderProps) {
  const { children, className, ...rest } = props;
  return (
    <div
      data-slot="code-block-header"
      className={cn(
        'bg-muted/80 text-muted-foreground flex items-center justify-between border-b px-3 py-2 text-xs',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

// ------------------------------------------------------------
// CodeBlockTitle
// ------------------------------------------------------------

export type CodeBlockTitleProps = ComponentProps<'div'>;

function CodeBlockTitle(props: CodeBlockTitleProps) {
  const { children, className, ...rest } = props;
  return (
    <div data-slot="code-block-title" className={cn('flex items-center gap-2', className)} {...rest}>
      {children}
    </div>
  );
}

// ------------------------------------------------------------
// CodeBlockFilename
// ------------------------------------------------------------

export type CodeBlockFilenameProps = ComponentProps<'span'>;

function CodeBlockFilename(props: CodeBlockFilenameProps) {
  const { children, className, ...rest } = props;
  return (
    <span data-slot="code-block-filename" className={cn('font-mono', className)} {...rest}>
      {children}
    </span>
  );
}

// ------------------------------------------------------------
// CodeBlockActions
// ------------------------------------------------------------

export type CodeBlockActionsProps = ComponentProps<'div'>;

function CodeBlockActions(props: CodeBlockActionsProps) {
  const { children, className, ...rest } = props;
  return (
    <div
      data-slot="code-block-actions"
      className={cn('-my-1 -mr-1 flex items-center gap-2', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

// ------------------------------------------------------------
// CodeBlockContent
// ------------------------------------------------------------

export type CodeBlockContentProps = {
  code: string;
  language: BundledLanguage;
  showLineNumbers?: boolean;
};

function CodeBlockContent(props: CodeBlockContentProps) {
  const { code, language, showLineNumbers = false } = props;

  // Memoized raw tokens for immediate display
  const rawTokens = useMemo(() => createRawTokens(code), [code]);

  // Synchronous cache lookup — avoids setState in effect for cached results
  const syncTokens = useMemo(
    () => highlightCode(code, language) ?? rawTokens,
    [code, language, rawTokens],
  );

  // Async highlighting result (populated after shiki loads)
  const [asyncTokens, setAsyncTokens] = useState<TokenizedCode | null>(null);
  const asyncKeyRef = useRef({ code, language });

  // Invalidate stale async tokens synchronously during render
  // eslint-disable-next-line react-hooks/refs
  if (asyncKeyRef.current.code !== code || asyncKeyRef.current.language !== language) {
    // eslint-disable-next-line react-hooks/refs
    asyncKeyRef.current = { code, language };
    setAsyncTokens(null);
  }

  useEffect(() => {
    let cancelled = false;

    highlightCode(code, language, (result) => {
      if (!cancelled) {
        setAsyncTokens(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const tokenized = asyncTokens ?? syncTokens;

  return (
    <div data-slot="code-block-content" className="relative overflow-auto">
      <CodeBlockBody showLineNumbers={showLineNumbers} tokenized={tokenized} />
    </div>
  );
}

// ------------------------------------------------------------
// CodeBlockCopyButton
// ------------------------------------------------------------

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

function CodeBlockCopyButton(props: CodeBlockCopyButtonProps) {
  const { onCopy, onError, timeout = 2000, children, className, ...rest } = props;

  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<number>(0);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
      onError?.(new Error('Clipboard API not available'));
      return;
    }

    try {
      if (!isCopied) {
        await navigator.clipboard.writeText(code);
        setIsCopied(true);
        onCopy?.();
        timeoutRef.current = window.setTimeout(() => setIsCopied(false), timeout);
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, [code, onCopy, onError, timeout, isCopied]);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn('shrink-0', className)}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...rest}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
}

// ------------------------------------------------------------
// CodeBlockLanguageSelector
// ------------------------------------------------------------

export type CodeBlockLanguageSelectorProps = ComponentProps<typeof Select>;

function CodeBlockLanguageSelector(props: CodeBlockLanguageSelectorProps) {
  return <Select {...props} />;
}

// ------------------------------------------------------------
// CodeBlockLanguageSelectorTrigger
// ------------------------------------------------------------

export type CodeBlockLanguageSelectorTriggerProps = ComponentProps<typeof Select.Trigger>;

function CodeBlockLanguageSelectorTrigger(props: CodeBlockLanguageSelectorTriggerProps) {
  const { className, ...rest } = props;
  return (
    <Select.Trigger
      className={cn('h-7 border-none bg-transparent px-2 text-xs shadow-none', className)}
      size="sm"
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// CodeBlockLanguageSelectorValue
// ------------------------------------------------------------

export type CodeBlockLanguageSelectorValueProps = ComponentProps<typeof Select.Value>;

function CodeBlockLanguageSelectorValue(props: CodeBlockLanguageSelectorValueProps) {
  return <Select.Value {...props} />;
}

// ------------------------------------------------------------
// CodeBlockLanguageSelectorContent
// ------------------------------------------------------------

export type CodeBlockLanguageSelectorContentProps = ComponentProps<typeof Select.Content>;

function CodeBlockLanguageSelectorContent(props: CodeBlockLanguageSelectorContentProps) {
  const { align = 'end', ...rest } = props;
  return <Select.Content align={align} {...rest} />;
}

// ------------------------------------------------------------
// CodeBlockLanguageSelectorItem
// ------------------------------------------------------------

export type CodeBlockLanguageSelectorItemProps = ComponentProps<typeof Select.Item>;

function CodeBlockLanguageSelectorItem(props: CodeBlockLanguageSelectorItemProps) {
  return <Select.Item {...props} />;
}

// ------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------

type TokenizedCode = {
  tokens: ThemedToken[][];
  fg: string;
  bg: string;
};

type KeyedToken = {
  token: ThemedToken;
  key: string;
};

type KeyedLine = {
  tokens: KeyedToken[];
  key: string;
};

// Highlighter cache (singleton per language)
const highlighterCache = new Map<string, Promise<HighlighterGeneric<BundledLanguage, BundledTheme>>>();

// Token cache
const tokensCache = new Map<string, TokenizedCode>();

// Subscribers for async token updates
const subscribers = new Map<string, Set<(result: TokenizedCode) => void>>();

function getTokensCacheKey(code: string, language: BundledLanguage) {
  const start = code.slice(0, 100);
  const end = code.length > 100 ? code.slice(-100) : '';
  return `${language}:${code.length}:${start}:${end}`;
}

function getHighlighter(
  language: BundledLanguage,
): Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> {
  const cached = highlighterCache.get(language);
  if (cached) {
    return cached;
  }

  const highlighterPromise = createHighlighter({
    langs: [language],
    themes: ['github-light', 'github-dark'],
  });

  highlighterCache.set(language, highlighterPromise);
  return highlighterPromise;
}

// Create raw tokens for immediate display while highlighting loads
function createRawTokens(code: string): TokenizedCode {
  return {
    bg: 'transparent',
    fg: 'inherit',
    tokens: code
      .split('\n')
      .map((line) => (line === '' ? [] : [{ color: 'inherit', content: line } as ThemedToken])),
  };
}

// Synchronous highlight with callback for async results
function highlightCode(
  code: string,
  language: BundledLanguage,
  // oxlint-disable-next-line eslint-plugin-promise(prefer-await-to-callbacks)
  callback?: (result: TokenizedCode) => void,
): TokenizedCode | null {
  const tokensCacheKey = getTokensCacheKey(code, language);

  // Return cached result if available
  const cached = tokensCache.get(tokensCacheKey);
  if (cached) {
    return cached;
  }

  // Subscribe callback if provided
  if (callback) {
    if (!subscribers.has(tokensCacheKey)) {
      subscribers.set(tokensCacheKey, new Set());
    }
    subscribers.get(tokensCacheKey)?.add(callback);
  }

  // Start highlighting in background - fire-and-forget async pattern
  getHighlighter(language)
    // oxlint-disable-next-line eslint-plugin-promise(prefer-await-to-then)
    .then((highlighter) => {
      const availableLangs = highlighter.getLoadedLanguages();
      const langToUse = availableLangs.includes(language) ? language : 'text';

      const result = highlighter.codeToTokens(code, {
        lang: langToUse,
        themes: {
          dark: 'github-dark',
          light: 'github-light',
        },
      });

      const tokenized: TokenizedCode = {
        bg: result.bg ?? 'transparent',
        fg: result.fg ?? 'inherit',
        tokens: result.tokens,
      };

      // Cache the result
      tokensCache.set(tokensCacheKey, tokenized);

      // Notify all subscribers
      const subs = subscribers.get(tokensCacheKey);
      if (subs) {
        for (const sub of subs) {
          sub(tokenized);
        }
        subscribers.delete(tokensCacheKey);
      }
    })
    // oxlint-disable-next-line eslint-plugin-promise(prefer-await-to-then), eslint-plugin-promise(prefer-await-to-callbacks)
    .catch((error) => {
      console.error('Failed to highlight code:', error);
      subscribers.delete(tokensCacheKey);
    });

  return null;
}

// Transform tokens to include pre-computed keys to avoid noArrayIndexKey lint
function addKeysToTokens(lines: ThemedToken[][]): KeyedLine[] {
  return lines.map((line, lineIdx) => ({
    key: `line-${lineIdx}`,
    tokens: line.map((token, tokenIdx) => ({
      key: `line-${lineIdx}-${tokenIdx}`,
      token,
    })),
  }));
}

// Shiki uses bitflags for font styles: 1=italic, 2=bold, 4=underline
function isItalic(fontStyle: number | undefined) {
  // oxlint-disable-next-line eslint(no-bitwise)
  return fontStyle && fontStyle & 1;
}

function isBold(fontStyle: number | undefined) {
  // oxlint-disable-next-line eslint(no-bitwise)
  return fontStyle && fontStyle & 2;
}

function isUnderline(fontStyle: number | undefined) {
  // oxlint-disable-next-line eslint(no-bitwise)
  return fontStyle && fontStyle & 4;
}

// Line number styles using CSS counters
const LINE_NUMBER_CLASSES = cn(
  'block',
  'before:content-[counter(line)]',
  'before:inline-block',
  'before:[counter-increment:line]',
  'before:w-8',
  'before:mr-4',
  'before:text-right',
  'before:text-muted-foreground/50',
  'before:font-mono',
  'before:select-none',
);

function TokenSpan(props: { token: ThemedToken }) {
  const { token } = props;
  return (
    <span
      className="dark:bg-(--shiki-dark-bg)! dark:text-(--shiki-dark)!"
      style={
        {
          backgroundColor: token.bgColor,
          color: token.color,
          fontStyle: isItalic(token.fontStyle) ? 'italic' : undefined,
          fontWeight: isBold(token.fontStyle) ? 'bold' : undefined,
          textDecoration: isUnderline(token.fontStyle) ? 'underline' : undefined,
          ...token.htmlStyle,
        } as CSSProperties
      }
    >
      {token.content}
    </span>
  );
}

function LineSpan(props: { keyedLine: KeyedLine; showLineNumbers: boolean }) {
  const { keyedLine, showLineNumbers } = props;
  return (
    <span className={showLineNumbers ? LINE_NUMBER_CLASSES : 'block'}>
      {keyedLine.tokens.length === 0
        ? '\n'
        : keyedLine.tokens.map(({ token, key }) => <TokenSpan key={key} token={token} />)}
    </span>
  );
}
