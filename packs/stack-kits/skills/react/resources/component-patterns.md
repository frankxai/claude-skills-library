# Advanced Component Patterns

## Compound Components

Pattern where components work together to form a cohesive UI:

```typescript
// Parent provides context
export function Tabs({ children, defaultValue }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

// Children consume context
export function Tab({ value, children }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={isActive ? 'active' : ''}
    >
      {children}
    </button>
  );
}

// Usage
<Tabs defaultValue="profile">
  <Tab value="profile">Profile</Tab>
  <Tab value="settings">Settings</Tab>
</Tabs>
```

## Render Props

Share code between components using a prop whose value is a function:

```typescript
interface DataFetcherProps<T> {
  url: string;
  children: (data: T | null, loading: boolean, error: Error | null) => ReactNode;
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return children(data, loading, error);
}

// Usage
<DataFetcher<User> url="/api/user">
  {(user, loading, error) => {
    if (loading) return <Loading />;
    if (error) return <Error message={error.message} />;
    return <UserProfile user={user} />;
  }}
</DataFetcher>
```

## Higher-Order Components (HOCs)

Function that takes a component and returns a new component:

```typescript
function withAuth<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();

    if (loading) return <Loading />;
    if (!user) return <Navigate to="/login" />;

    return <Component {...props} />;
  };
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);
```

## Custom Hooks Pattern

Extract complex logic into reusable hooks:

```typescript
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// Usage
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

## Controlled vs Uncontrolled Components

### Controlled
```typescript
function ControlledInput() {
  const [value, setValue] = useState('');

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
```

### Uncontrolled
```typescript
function UncontrolledInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    console.log(inputRef.current?.value);
  };

  return <input ref={inputRef} />;
}
```

**When to use:**
- Controlled: Form validation, conditional rendering, dynamic behavior
- Uncontrolled: Simple forms, file inputs, integrating with non-React code

## Container/Presentational Pattern

Separate data fetching from presentation:

```typescript
// Container - handles logic and data
function UserProfileContainer({ userId }: { userId: string }) {
  const { data: user, isLoading } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  });

  if (isLoading) return <UserProfileSkeleton />;

  return <UserProfilePresentation user={user} />;
}

// Presentation - pure UI component
interface UserProfilePresentationProps {
  user: User;
}

function UserProfilePresentation({ user }: UserProfilePresentationProps) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <Avatar src={user.avatar} />
    </div>
  );
}
```

## Error Boundaries

Handle errors gracefully in component trees:

```typescript
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <this.props.fallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={ErrorFallback}>
  <App />
</ErrorBoundary>
```
