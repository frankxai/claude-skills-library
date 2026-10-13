# Performance Optimization

## React.memo

Prevent unnecessary re-renders of expensive components:

```typescript
const ExpensiveComponent = React.memo(
  ({ data }: { data: ComplexData }) => {
    // Expensive rendering logic
    return <div>{/* complex UI */}</div>;
  },
  (prevProps, nextProps) => {
    // Custom comparison function
    return prevProps.data.id === nextProps.data.id;
  }
);
```

## useMemo for Expensive Calculations

```typescript
function DataGrid({ items, filters }: Props) {
  // Only recalculate when items or filters change
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      Object.entries(filters).every(([key, value]) =>
        item[key] === value
      )
    );
  }, [items, filters]);

  return <Grid items={filteredItems} />;
}
```

## useCallback for Event Handlers

```typescript
function TodoList({ todos }: { todos: Todo[] }) {
  // Stable function reference across re-renders
  const handleDelete = useCallback((id: string) => {
    deleteTodo(id);
  }, [deleteTodo]);

  return (
    <>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onDelete={handleDelete} // Same reference each render
        />
      ))}
    </>
  );
}
```

## Code Splitting with React.lazy

```typescript
// Split code at route level
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Profile = lazy(() => import('./Profile'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}
```

## Virtualization for Long Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5
  });

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <Item data={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Avoid Inline Object/Array Creation

```typescript
// ❌ Bad: New object created on every render
<Component style={{ margin: 10 }} />
<List items={items.filter(i => i.active)} />

// ✅ Good: Stable references
const style = { margin: 10 };
const activeItems = useMemo(
  () => items.filter(i => i.active),
  [items]
);

<Component style={style} />
<List items={activeItems} />
```

## Debounce Expensive Operations

```typescript
function SearchBox() {
  const [query, setQuery] = useState('');

  // Debounce the actual search API call
  const debouncedSearch = useMemo(
    () => debounce((q: string) => {
      searchAPI(q);
    }, 300),
    []
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  return <input value={query} onChange={handleChange} />;
}
```

## Use Transition API for Non-Urgent Updates

```typescript
import { useTransition } from 'react';

function TabContainer() {
  const [tab, setTab] = useState('posts');
  const [isPending, startTransition] = useTransition();

  const handleTabChange = (newTab: string) => {
    startTransition(() => {
      setTab(newTab);
    });
  };

  return (
    <>
      <TabList onChange={handleTabChange} />
      {isPending && <LoadingSpinner />}
      <TabContent tab={tab} />
    </>
  );
}
```

## useDeferredValue for Expensive Renders

```typescript
function SearchResults({ query }: { query: string }) {
  // Defer the expensive filtering operation
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(
    () => items.filter(item => item.name.includes(deferredQuery)),
    [deferredQuery]
  );

  return (
    <>
      {deferredQuery !== query && <LoadingIndicator />}
      <ResultsList results={results} />
    </>
  );
}
```

## Optimize Context Usage

```typescript
// ❌ Bad: Single context for everything
const AppContext = createContext({ user, theme, settings, notifications });

// ✅ Good: Separate contexts to prevent unnecessary re-renders
const UserContext = createContext(user);
const ThemeContext = createContext(theme);
const SettingsContext = createContext(settings);

// Even better: Use context selectors
function useUserName() {
  const user = useContext(UserContext);
  return user.name; // Only re-render when name changes
}
```

## Profile with React DevTools

```typescript
// Wrap expensive components to measure render time
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number
) {
  console.log(`${id} ${phase} took ${actualDuration}ms`);
}

<Profiler id="Dashboard" onRender={onRenderCallback}>
  <Dashboard />
</Profiler>
```

## Key Metrics to Monitor

- **Time to Interactive (TTI)**: When page becomes fully interactive
- **First Contentful Paint (FCP)**: When first content appears
- **Largest Contentful Paint (LCP)**: When main content is visible
- **Cumulative Layout Shift (CLS)**: Visual stability
- **Component render time**: Use React DevTools Profiler

## Performance Checklist

- [ ] Use React.memo for expensive pure components
- [ ] Implement code splitting at route boundaries
- [ ] Virtualize long lists (>100 items)
- [ ] Debounce/throttle input handlers
- [ ] Use useMemo for expensive calculations
- [ ] Use useCallback for event handlers passed to child components
- [ ] Avoid inline object/array creation in JSX
- [ ] Use Suspense for data fetching
- [ ] Optimize bundle size (analyze with webpack-bundle-analyzer)
- [ ] Use production builds in deployment
