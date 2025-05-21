Jazz provides two CoValue types for collaborative text editing, collectively referred to as "CoText" values:

- **co.plainText()** for simple text editing without formatting
- **co.richText()** for rich text with HTML-based formatting (extends co.plainText())

Both types enable real-time collaborative editing of text content while maintaining consistency across multiple users.

**Note:** If you're looking for a quick way to add rich text editing to your app, check out [jazz-richtext-prosemirror](https://jazz.tools/docs/react/using-covalues/cotexts#using-rich-text-with-prosemirror).

```
const note = co.plainText().create("Meeting notes", { owner: me });

// Update the text
note.applyDiff("Meeting notes for Tuesday");

console.log(note.toString());  // "Meeting notes for Tuesday"
```

For a full example of CoTexts in action, see [our Richtext example app](https://github.com/garden-co/jazz/tree/main/examples/richtext), which shows plain text and rich text editing.

## [](https://jazz.tools/docs/react/using-covalues/cotexts#coplaintext-vs-zstring)co.plainText() vs z.string()

While `z.string()` is perfect for simple text fields, `co.plainText()` is the right choice when you need:

- Frequent text edits that aren't just replacing the whole field
- Fine-grained control over text edits (inserting, deleting at specific positions)
- Multiple users editing the same text simultaneously
- Character-by-character collaboration
- Efficient merging of concurrent changes

Both support real-time updates, but `co.plainText()` provides specialized tools for collaborative editing scenarios.

## [](https://jazz.tools/docs/react/using-covalues/cotexts#creating-cotext-values)Creating CoText Values

CoText values are typically used as fields in your schemas:

```
const Profile = co.profile({
  name: z.string(),
  bio: co.plainText(),         // Plain text field
  description: co.richText(),  // Rich text with formatting
});
```

Create a CoText value with a simple string:

```
// Create plaintext with default ownership (current user)
const note = co.plainText().create("Meeting notes", { owner: me });

// Create rich text with HTML content
const document = co.richText().create("<p>Project <strong>overview</strong></p>",
  { owner: me }
);
```

### [](https://jazz.tools/docs/react/using-covalues/cotexts#ownership)Ownership

Like other CoValues, you can specify ownership when creating CoTexts.

```
// Create with shared ownership
const teamGroup = Group.create();
teamGroup.addMember(colleagueAccount, "writer");

const teamNote = co.plainText().create("Team updates", { owner: teamGroup });
```

See [Groups as permission scopes](https://jazz.tools/docs/react/groups/intro) for more information on how to use groups to control access to CoText values.

## [](https://jazz.tools/docs/react/using-covalues/cotexts#reading-text)Reading Text

CoText values work similarly to JavaScript strings:

```
// Get the text content
console.log(note.toString());  // "Meeting notes"
console.log(`${note}`);    // "Meeting notes"

// Check the text length
console.log(note.length);      // 14
```

When using CoTexts in JSX, you can read the text directly:

```
<>
  <p>{note.toString()}</p>
  <p>{note}</p>
</>
```

## [](https://jazz.tools/docs/react/using-covalues/cotexts#making-edits)Making Edits

Insert and delete text with intuitive methods:

```
// Insert text at a specific position
note.insertBefore(8, "weekly ");  // "Meeting weekly notes"

// Insert after a position
note.insertAfter(21, " for Monday");  // "Meeting weekly notes for Monday"

// Delete a range of text
note.deleteRange({ from: 8, to: 15 });  // "Meeting notes for Monday"

// Apply a diff to update the entire text
note.applyDiff("Team meeting notes for Tuesday");
```

### [](https://jazz.tools/docs/react/using-covalues/cotexts#applying-diffs)Applying Diffs

Use `applyDiff` to efficiently update text with minimal changes:

```
// Original text: "Team status update"
const minutes = co.plainText().create("Team status update", { owner: me });

// Replace the entire text with a new version
minutes.applyDiff("Weekly team status update for Project X");

// Make partial changes
let text = minutes.toString();
text = text.replace("Weekly", "Monday");
minutes.applyDiff(text);  // Efficiently updates only what changed
```

Perfect for handling user input in form controls:

```
function TextEditor({ textId }: { textId: string }) {
  const note = useCoState(co.plainText(), textId);

  return (
    note && <textarea
      value={note.toString()}
      onChange={(e) => {
        // Efficiently update only what the user changed
        note.applyDiff(e.target.value);
      }}
    />
  );
}
```

## [](https://jazz.tools/docs/react/using-covalues/cotexts#using-rich-text-with-prosemirror)Using Rich Text with ProseMirror

Jazz provides a dedicated plugin for integrating co.richText() with the popular ProseMirror editor. This plugin, [`jazz-richtext-prosemirror`](https://www.npmjs.com/package/jazz-richtext-prosemirror), enables bidirectional synchronization between your co.richText() instances and ProseMirror editors.

### [](https://jazz.tools/docs/react/using-covalues/cotexts#prosemirror-plugin-features)ProseMirror Plugin Features

- **Bidirectional Sync**: Changes in the editor automatically update the co.richText() and vice versa
- **Real-time Collaboration**: Multiple users can edit the same document simultaneously
- **HTML Conversion**: Automatically converts between HTML (used by co.richText()) and ProseMirror's document model

### [](https://jazz.tools/docs/react/using-covalues/cotexts#installation)Installation

```
pnpm add jazz-richtext-prosemirror \
  prosemirror-view \
  prosemirror-state \
  prosemirror-schema-basic
```

### [](https://jazz.tools/docs/react/using-covalues/cotexts#integration)Integration

For use with React:

```
// RichTextEditor.tsx
import { createJazzPlugin } from "jazz-richtext-prosemirror";
import { exampleSetup } from "prosemirror-example-setup";
import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

function RichTextEditor() {
  const { me } = useAccount(JazzAccount, { resolve: { profile: true } });
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!me?.profile.bio || !editorRef.current) return;

    // Create the Jazz plugin for ProseMirror
    // Providing a co.richText() instance to the plugin to automatically sync changes
    const jazzPlugin = createJazzPlugin(me.profile.bio);

    // Set up ProseMirror with the Jazz plugin
    if (!viewRef.current) {
      viewRef.current = new EditorView(editorRef.current, {
        state: EditorState.create({
          schema,
          plugins: [
            ...exampleSetup({ schema }),
            jazzPlugin,
          ],
        }),
      });
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [me?.profile.bio?.id]);

  if (!me) return null;

  return (
    <div className="border rounded">
      <div ref={editorRef} className="p-2" />
    </div>
  );
}
```
