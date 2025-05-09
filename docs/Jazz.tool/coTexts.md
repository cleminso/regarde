Jazz provides two CoValue types for collaborative text editing, collectively referred to as "CoText" values:

- **CoPlainText** for simple text editing without formatting
- **CoRichText** for rich text with HTML-based formatting (extends CoPlainText)

Both types enable real-time collaborative editing of text content while maintaining consistency across multiple users.

**Note:** If you're looking for a quick way to add rich text editing to your app, check out [jazz-richtext-prosemirror](https://jazz.tools/docs/react/using-covalues/cotexts#using-rich-text-with-prosemirror).

```
const note = CoPlainText.create("Meeting notes", { owner: me });

// Update the text
note.applyDiff("Meeting notes for Tuesday");

console.log(note.toString());  // "Meeting notes for Tuesday"
```

For a full example of CoTexts in action, see [our Richtext example app](https://github.com/garden-co/jazz/tree/main/examples/richtext), which shows plain text and rich text editing.

## [](https://jazz.tools/docs/react/using-covalues/cotexts#coplaintext-vs-costring)CoPlainText vs co.string

While `co.string` is perfect for simple text fields, `CoPlainText` is the right choice when you need:

- Multiple users editing the same text simultaneously
- Fine-grained control over text edits (inserting, deleting at specific positions)
- Character-by-character collaboration
- Efficient merging of concurrent changes

Both support real-time updates, but `CoPlainText` provides specialized tools for collaborative editing scenarios.

## [](https://jazz.tools/docs/react/using-covalues/cotexts#creating-cotext-values)Creating CoText Values

CoText values are typically used as fields in your schemas:

```
class Profile extends CoMap {
  name = co.string;
  bio = co.ref(CoPlainText);         // Plain text field
  description = co.ref(CoRichText);  // Rich text with formatting
}
```

Create a CoText value with a simple string:

```
// Create plaintext with default ownership (current user)
const note = CoPlainText.create("Meeting notes", { owner: me });

// Create rich text with HTML content
const document = CoRichText.create("<p>Project <strong>overview</strong></p>",
  { owner: me }
);
```

### [](https://jazz.tools/docs/react/using-covalues/cotexts#ownership)Ownership

Like other CoValues, you can specify ownership when creating CoTexts.

```
// Create with shared ownership
const teamGroup = Group.create();
teamGroup.addMember(colleagueAccount, "writer");

const teamNote = CoPlainText.create("Team updates", { owner: teamGroup });
```

See [Groups as permission scopes](https://jazz.tools/docs/react/groups/intro) for more information on how to use groups to control access to CoText values.

## [](https://jazz.tools/docs/react/using-covalues/cotexts#reading-text)Reading Text

CoText values work like JavaScript strings:

```
// Get the text content
console.log(note.toString());  // "Meeting notes"

// Check the text length
console.log(note.length);      // 14
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
const minutes = CoPlainText.create("Team status update", { owner: me });

// Replace the entire text with a new version
minutes.applyDiff("Weekly team status update for Project X");

// Make partial changes
let text = minutes.toString();
text = text.replace("Weekly", "Monday");
minutes.applyDiff(text);  // Efficiently updates only what changed
```

Perfect for handling user input in form controls:

```
function TextEditor() {
  const [note, setNote] = useState(CoPlainText.create("", { owner: me }));

  return (
    <textarea
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

Jazz provides a dedicated plugin for integrating CoRichText with the popular ProseMirror editor. This plugin, [`jazz-richtext-prosemirror`](https://www.npmjs.com/package/jazz-richtext-prosemirror), enables bidirectional synchronization between your CoRichText instances and ProseMirror editors.

### [](https://jazz.tools/docs/react/using-covalues/cotexts#prosemirror-plugin-features)ProseMirror Plugin Features

- **Bidirectional Sync**: Changes in the editor automatically update the CoRichText and vice versa
- **Real-time Collaboration**: Multiple users can edit the same document simultaneously
- **HTML Conversion**: Automatically converts between HTML (used by CoRichText) and ProseMirror's document model

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
  const { me } = useAccount({ resolve: { profile: true } });
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!me?.profile.bio || !editorRef.current) return;

    // Create the Jazz plugin for ProseMirror
    // Providing a CoRichText instance to the plugin to automatically sync changes
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
