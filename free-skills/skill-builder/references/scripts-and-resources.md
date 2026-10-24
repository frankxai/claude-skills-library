# Adding scripts and resources

Part of the `skill-builder` skill. SKILL.md links here; read it when a skill needs a script, a template or a data file.

## 🛠️ Adding Scripts and Resources

#### Scripts Directory

**Purpose**: Executable scripts that Claude can run
**Location**: `scripts/` in skill directory
**Usage**: Referenced from SKILL.md

Example:
```bash
# In skill directory
scripts/
├── setup.sh          # Initialization script
├── validate.js       # Validation logic
├── generate.py       # Code generation
└── deploy.sh         # Deployment script
```

Reference from SKILL.md:
````markdown
## Setup
Run the setup script:
```bash
./scripts/setup.sh
```

## Validation
Validate your configuration:
```bash
node scripts/validate.js config.json
```
````

#### Resources Directory

**Purpose**: Templates, examples, schemas, static files
**Location**: `resources/` in skill directory
**Usage**: Referenced or copied by scripts

Example:
```bash
resources/
├── templates/
│   ├── component.tsx.template
│   ├── test.spec.ts.template
│   └── story.stories.tsx.template
├── examples/
│   ├── basic-example/
│   ├── advanced-example/
│   └── integration-example/
└── schemas/
    ├── config.schema.json
    └── output.schema.json
```

Reference from SKILL.md:
````markdown
## Templates
Use the component template:
```bash
cp resources/templates/component.tsx.template src/components/MyComponent.tsx
```

## Examples
See working examples in `resources/examples/`:
- `basic-example/` - Simple component
- `advanced-example/` - With hooks and context
````
