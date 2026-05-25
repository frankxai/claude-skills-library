# Framer Expert Skill

A comprehensive Claude Code skill for Framer design and development expertise, with integrated Framer MCP server support.

## Features

- **Framer MCP Integration**: Direct access to Framer projects through Model Context Protocol
- **Design to Production**: Complete workflow from prototyping to live sites
- **Framer Motion Mastery**: Advanced animation patterns and interactions
- **Code Components**: Custom React components with Framer property controls
- **CMS Integration**: Content management and dynamic pages
- **Performance Optimization**: Best practices for production sites
- **Responsive Design**: Mobile-first approach with breakpoint strategies

## Activation

Activate the Framer Expert skill by using:

```
/skill framer-expert
```

Or simply type `framer-expert` to invoke the skill.

## MCP Server Setup

The Framer MCP server has been installed and configured. After restarting Claude Code, you'll have access to:

- List Framer projects
- Query project structure
- Access components and variants
- Retrieve CMS collections
- Monitor builds and deployments

## Use Cases

### Design & Prototyping
- Create interactive prototypes
- Design component libraries
- Build design systems
- Implement animations

### Development
- Custom code components
- Framer Motion animations
- React integration
- API integrations

### Production Sites
- Build marketing websites
- Create landing pages
- Implement CMS-driven blogs
- Deploy to custom domains

## Example Interactions

### Get Animation Help
```
"How do I create a staggered list animation in Framer Motion?"
```

### Build Components
```
"Create a custom button component with hover effects and property controls"
```

### MCP Project Analysis
```
"Analyze my Framer project structure and suggest optimizations"
```

### CMS Integration
```
"How do I set up a blog with Framer CMS and dynamic routing?"
```

## Integration with Other Skills

- **ui-ux-design-expert**: Apply design principles to Framer projects
- **nextjs-react-expert**: Advanced React patterns
- **frankx-content**: Branded content creation
- **product-management-expert**: Rapid prototyping

## Quick Reference

### Common Framer Motion Patterns

**Fade In**:
```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
/>
```

**Spring Animation**:
```jsx
<motion.div
  animate={{ scale: 1.2 }}
  transition={{ type: "spring", stiffness: 260, damping: 20 }}
/>
```

**Hover Effect**:
```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>
```

**Stagger Children**:
```jsx
<motion.ul
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {items.map((item) => (
    <motion.li variants={itemVariants}>{item}</motion.li>
  ))}
</motion.ul>
```

## Resources

- [Framer Documentation](https://www.framer.com/docs/)
- [Framer Motion API](https://www.framer.com/motion/)
- [Framer Community](https://www.framer.com/community/)
- [MCP Documentation](https://mcp.unframer.co/)

## Version

1.0.0 - Initial release with MCP integration

---

**Note**: After installing the Framer MCP server, restart Claude Code to enable MCP functionality.
