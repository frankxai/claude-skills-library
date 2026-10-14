# TypeScript Patterns for React

## Component Props with TypeScript

```typescript
// Basic props interface
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className={variant}>
      {label}
    </button>
  );
}
```

## Extending HTML Element Props

```typescript
// Extend native button props
interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  icon?: ReactNode;
}

function CustomButton({ loading, icon, children, ...buttonProps }: CustomButtonProps) {
  return (
    <button {...buttonProps} disabled={loading || buttonProps.disabled}>
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}
```

## Generic Components

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

// Usage with type inference
<List
  items={users}
  renderItem={(user) => <UserCard user={user} />}
  keyExtractor={(user) => user.id}
/>
```

## Discriminated Unions for Component States

```typescript
type DataState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T };

function DataDisplay<T>({ state }: { state: DataState<T> }) {
  switch (state.status) {
    case 'loading':
      return <Loading />;
    case 'error':
      return <Error message={state.error.message} />;
    case 'success':
      return <Data data={state.data} />;
  }
}
```

## Typed Event Handlers

```typescript
interface FormProps {
  onSubmit: (data: FormData) => void;
}

function Form({ onSubmit }: FormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Handle enter key
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleInputChange} onKeyPress={handleKeyPress} />
    </form>
  );
}
```

## Ref Types

```typescript
// DOM element refs
function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} />;
}

// Component refs (React 19: ref as prop, no forwardRef needed)
interface InputProps {
  placeholder: string;
  ref?: React.Ref<HTMLInputElement>;
}

function Input({ placeholder, ref }: InputProps) {
  return <input ref={ref} placeholder={placeholder} />;
}
```

## Context with TypeScript

```typescript
interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const value: AuthContextValue = {
    user,
    login: async (email, password) => {
      const user = await loginAPI(email, password);
      setUser(user);
    },
    logout: () => setUser(null)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

## Utility Types for Props

```typescript
// Pick specific props from another component
type IconProps = Pick<ButtonProps, 'size' | 'color'>;

// Omit specific props
type ButtonWithoutClick = Omit<ButtonProps, 'onClick'>;

// Make all props optional
type PartialButtonProps = Partial<ButtonProps>;

// Make all props required
type RequiredButtonProps = Required<ButtonProps>;

// Extract prop types from a component
type MyButtonProps = ComponentProps<typeof Button>;
```

## Render Props with TypeScript

```typescript
interface RenderPropProps<T> {
  data: T;
  render: (data: T) => ReactNode;
}

function DataRenderer<T>({ data, render }: RenderPropProps<T>) {
  return <>{render(data)}</>;
}

// Usage
<DataRenderer
  data={user}
  render={(user) => <UserProfile user={user} />}
/>
```

## As Prop Pattern

```typescript
interface BoxProps<T extends ElementType = 'div'> {
  as?: T;
  children: ReactNode;
}

type PolymorphicProps<T extends ElementType> = BoxProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof BoxProps>;

function Box<T extends ElementType = 'div'>({
  as,
  children,
  ...props
}: PolymorphicProps<T>) {
  const Component = as || 'div';
  return <Component {...props}>{children}</Component>;
}

// Usage - full type safety!
<Box as="button" onClick={() => {}} />  // onClick is typed
<Box as="a" href="/">Link</Box>         // href is typed
```

## Controlled Component Types

```typescript
interface ControlledInputProps {
  value: string;
  onChange: (value: string) => void;
}

function ControlledInput({ value, onChange }: ControlledInputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// With generic for any value type
interface ControlledFieldProps<T> {
  value: T;
  onChange: (value: T) => void;
}
```

## Type-Safe Form Handling

```typescript
interface LoginForm {
  email: string;
  password: string;
}

function LoginForm() {
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: ''
  });

  const handleChange = <K extends keyof LoginForm>(
    field: K,
    value: LoginForm[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form>
      <input
        value={form.email}
        onChange={(e) => handleChange('email', e.target.value)}
      />
      <input
        value={form.password}
        onChange={(e) => handleChange('password', e.target.value)}
        type="password"
      />
    </form>
  );
}
```

## Children Prop Patterns

```typescript
// ReactNode (most common)
interface ContainerProps {
  children: ReactNode;
}

// Render function
interface RenderChildrenProps {
  children: (data: Data) => ReactNode;
}

// Specific component type
interface LayoutProps {
  children: ReactElement<HeaderProps> | ReactElement<HeaderProps>[];
}

// Array of specific elements
interface TabsProps {
  children: ReactElement<TabProps>[];
}
```

## Type Guards for Components

```typescript
function isButtonElement(
  element: ReactElement
): element is ReactElement<ButtonProps> {
  return element.type === Button;
}

function Container({ children }: { children: ReactNode }) {
  const buttons = Children.toArray(children).filter(
    (child): child is ReactElement<ButtonProps> =>
      isValidElement(child) && isButtonElement(child)
  );

  return <div>{buttons}</div>;
}
```
