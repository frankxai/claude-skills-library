# Custom Hooks and Advanced Patterns

## useToggle

```typescript
function useToggle(initialValue = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(v => !v), []);
  const set = useCallback((newValue: boolean) => setValue(newValue), []);

  return [value, toggle, set];
}

// Usage
const [isOpen, toggleOpen, setOpen] = useToggle(false);
```

## usePrevious

```typescript
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// Usage
const [count, setCount] = useState(0);
const previousCount = usePrevious(count);
```

## useDebounce

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearch) {
    searchAPI(debouncedSearch);
  }
}, [debouncedSearch]);
```

## useEventListener

```typescript
function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | HTMLElement = window
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event: Event) => savedHandler.current(event as WindowEventMap[K]);
    element.addEventListener(eventName, eventListener);

    return () => element.removeEventListener(eventName, eventListener);
  }, [eventName, element]);
}

// Usage
useEventListener('resize', () => console.log('Window resized'));
useEventListener('click', (e) => console.log('Clicked', e.target), buttonRef.current);
```

## useMediaQuery

```typescript
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Usage
const isMobile = useMediaQuery('(max-width: 768px)');
const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
```

## useIntersectionObserver

```typescript
function useIntersectionObserver(
  elementRef: RefObject<Element>,
  options?: IntersectionObserverInit
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      options
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, options]);

  return entry;
}

// Usage - Infinite scroll
const loadMoreRef = useRef<HTMLDivElement>(null);
const entry = useIntersectionObserver(loadMoreRef, { threshold: 0.5 });

useEffect(() => {
  if (entry?.isIntersecting) {
    loadMore();
  }
}, [entry]);
```

## useAsync

```typescript
interface AsyncState<T> {
  loading: boolean;
  error: Error | null;
  data: T | null;
}

function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: DependencyList = []
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    loading: true,
    error: null,
    data: null
  });

  useEffect(() => {
    setState({ loading: true, error: null, data: null });

    asyncFunction()
      .then(data => setState({ loading: false, error: null, data }))
      .catch(error => setState({ loading: false, error, data: null }));
  }, dependencies);

  return state;
}

// Usage
const { loading, error, data } = useAsync(
  () => fetchUser(userId),
  [userId]
);
```

## useInterval

```typescript
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// Usage
const [count, setCount] = useState(0);
const [isRunning, setIsRunning] = useState(true);

useInterval(
  () => setCount(count + 1),
  isRunning ? 1000 : null
);
```

## useClickOutside

```typescript
function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// Usage - Close dropdown when clicking outside
const dropdownRef = useRef<HTMLDivElement>(null);
useClickOutside(dropdownRef, () => setIsOpen(false));
```

## useCopyToClipboard

```typescript
function useCopyToClipboard(): [
  boolean,
  (text: string) => Promise<void>
] {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopied(false);
    }
  }, []);

  return [copied, copy];
}

// Usage
const [copied, copy] = useCopyToClipboard();

<button onClick={() => copy(codeSnippet)}>
  {copied ? 'Copied!' : 'Copy'}
</button>
```

## useFormInput

```typescript
function useFormInput<T extends string | number>(initialValue: T) {
  const [value, setValue] = useState(initialValue);

  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setValue(e.target.value as T);
  }, []);

  const reset = useCallback(() => setValue(initialValue), [initialValue]);

  return {
    value,
    onChange: handleChange,
    reset
  };
}

// Usage
const email = useFormInput('');
const password = useFormInput('');

<input type="email" {...email} />
<input type="password" {...password} />
```

## useWindowSize

```typescript
interface WindowSize {
  width: number;
  height: number;
}

function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// Usage
const { width, height } = useWindowSize();
const isMobile = width < 768;
```

## useOnlineStatus

```typescript
function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Usage
const isOnline = useOnlineStatus();
{!isOnline && <OfflineBanner />}
```

## useTimeout

```typescript
function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

// Usage - Auto-save draft after 3 seconds of inactivity
useTimeout(() => saveDraft(content), hasUnsavedChanges ? 3000 : null);
```

## useFetch

```typescript
function useFetch<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    setLoading(true);

    fetch(url, { ...options, signal: abortController.signal })
      .then(res => res.json())
      .then(data => {
        setData(data);
        setError(null);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err);
        }
      })
      .finally(() => setLoading(false));

    return () => abortController.abort();
  }, [url]);

  return { data, loading, error };
}

// Usage
const { data, loading, error } = useFetch<User>('/api/user/123');
```

## Hook Composition

Combine multiple hooks for complex functionality:

```typescript
function useAuthenticatedFetch<T>(url: string) {
  const { token } = useAuth();
  const { data, loading, error } = useFetch<T>(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return { data, loading, error };
}

// Or build upon simpler hooks
function useForm(initialValues: Record<string, any>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = useCallback((field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    reset
  };
}
```
