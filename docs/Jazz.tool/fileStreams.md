FileStreams handle binary data in Jazz applications - think documents, audio files, and other non-text content. They're essentially collaborative versions of `Blob`s that sync automatically across devices.

Use FileStreams when you need to:

- Distribute documents across devices
- Store audio or video files
- Sync any binary data between users

**Note:** For images specifically, Jazz provides the higher-level `ImageDefinition` abstraction which manages multiple image resolutions - see the [ImageDefinition documentation](https://jazz.tools/docs/react/using-covalues/imagedef) for details.

FileStreams provide automatic chunking when using the `createFromBlob` method, track upload progress, and handle MIME types and metadata.

In your schema, reference FileStreams like any other CoValue:

```
// schema.ts
import { CoMap, FileStream, co } from "jazz-tools";

class Document extends CoMap {
  title = co.string;
  file = co.ref(FileStream);  // Store a document file
}
```

## [](https://jazz.tools/docs/react/using-covalues/filestreams#creating-filestreams)Creating FileStreams

There are two main ways to create FileStreams: creating empty ones for manual data population or creating directly from existing files or blobs.

### [](https://jazz.tools/docs/react/using-covalues/filestreams#creating-from-blobs-and-files)Creating from Blobs and Files

For files from input elements or drag-and-drop interfaces, use `createFromBlob`:

```
// From a file input
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  // Create FileStream from user-selected file
  const fileStream = await FileStream.createFromBlob(file, { owner: myGroup });

  // Or with progress tracking for better UX
  const fileWithProgress = await FileStream.createFromBlob(file, {
    onProgress: (progress) => {
      // progress is a value between 0 and 1
      const percent = Math.round(progress * 100);
      console.log(`Upload progress: ${percent}%`);
      progressBar.style.width = `${percent}%`;
    },
    owner: myGroup
  });
});
```

### [](https://jazz.tools/docs/react/using-covalues/filestreams#creating-empty-filestreams)Creating Empty FileStreams

Create an empty FileStream when you want to manually [add binary data in chunks](https://jazz.tools/docs/react/using-covalues/filestreams#writing-to-filestreams):

```
// Create a new empty FileStream
const fileStream = FileStream.create({ owner: myGroup } );
```

### [](https://jazz.tools/docs/react/using-covalues/filestreams#ownership)Ownership

Like other CoValues, you can specify ownership when creating FileStreams.

```
// Create a team group
const teamGroup = Group.create();
teamGroup.addMember(colleagueAccount, "writer");

// Create a FileStream with shared ownership
const teamFileStream = FileStream.create({ owner: teamGroup });
```

See [Groups as permission scopes](https://jazz.tools/docs/react/groups/intro) for more information on how to use groups to control access to FileStreams.

## [](https://jazz.tools/docs/react/using-covalues/filestreams#reading-from-filestreams)Reading from FileStreams

`FileStream`s provide several ways to access their binary content, from raw chunks to convenient Blob objects.

### [](https://jazz.tools/docs/react/using-covalues/filestreams#getting-raw-data-chunks)Getting Raw Data Chunks

To access the raw binary data and metadata:

```
// Get all chunks and metadata
const fileData = fileStream.getChunks();

if (fileData) {
  console.log(`MIME type: ${fileData.mimeType}`);
  console.log(`Total size: ${fileData.totalSizeBytes} bytes`);
  console.log(`File name: ${fileData.fileName}`);
  console.log(`Is complete: ${fileData.finished}`);

  // Access raw binary chunks
  for (const chunk of fileData.chunks) {
    // Each chunk is a Uint8Array
    console.log(`Chunk size: ${chunk.length} bytes`);
  }
}
```

By default, `getChunks()` only returns data for completely synced `FileStream`s. To start using chunks from a `FileStream` that's currently still being synced use the `allowUnfinished` option:

```
// Get data even if the stream isn't complete
const partialData = fileStream.getChunks({ allowUnfinished: true });
```

### [](https://jazz.tools/docs/react/using-covalues/filestreams#converting-to-blobs)Converting to Blobs

For easier integration with web APIs, convert to a `Blob`:

```
// Convert to a Blob
const blob = fileStream.toBlob();

// Get the filename from the metadata
const filename = fileStream.getChunks()?.fileName;

if (blob) {
  // Use with URL.createObjectURL
  const url = URL.createObjectURL(blob);

  // Create a download link
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'document.pdf';
  link.click();

  // Clean up when done
  URL.revokeObjectURL(url);
}
```

### [](https://jazz.tools/docs/react/using-covalues/filestreams#loading-filestreams-as-blobs)Loading FileStreams as Blobs

You can directly load a `FileStream` as a `Blob` when you only have its ID:

```
// Load directly as a Blob when you have an ID
const blob = await FileStream.loadAsBlob(fileStreamId);

// By default, waits for complete uploads
// For in-progress uploads:
const partialBlob = await FileStream.loadAsBlob(fileStreamId, {
  allowUnfinished: true
});
```

### [](https://jazz.tools/docs/react/using-covalues/filestreams#checking-completion-status)Checking Completion Status

Check if a `FileStream` is fully synced:

```
if (fileStream.isBinaryStreamEnded()) {
  console.log('File is completely synced');
} else {
  console.log('File upload is still in progress');
}
```

## [](https://jazz.tools/docs/react/using-covalues/filestreams#writing-to-filestreams)Writing to FileStreams

When creating a `FileStream` manually (not using `createFromBlob`), you need to manage the upload process yourself. This gives you more control over chunking and progress tracking.

### [](https://jazz.tools/docs/react/using-covalues/filestreams#the-upload-lifecycle)The Upload Lifecycle

`FileStream` uploads follow a three-stage process:

1.  **Start** - Initialize with metadata
2.  **Push** - Send one or more chunks of data
3.  **End** - Mark the stream as complete

### [](https://jazz.tools/docs/react/using-covalues/filestreams#undefined)Starting a `FileStream`

Begin by providing metadata about the file:

```
// Create an empty FileStream
const fileStream = FileStream.create({ owner: myGroup });

// Initialize with metadata
fileStream.start({
  mimeType: 'application/pdf',      // MIME type (required)
  totalSizeBytes: 1024 * 1024 * 2,  // Size in bytes (if known)
  fileName: 'document.pdf'          // Original filename (optional)
});
```

### [](https://jazz.tools/docs/react/using-covalues/filestreams#pushing-data)Pushing Data

Add binary data in chunks - this helps with large files and progress tracking:

```
const data = new Uint8Array(arrayBuffer);

// For large files, break into chunks (e.g., 100KB each)
const chunkSize = 1024 * 100;
for (let i = 0; i < data.length; i += chunkSize) {
  // Create a slice of the data
  const chunk = data.slice(i, i + chunkSize);

  // Push chunk to the FileStream
  fileStream.push(chunk);

  // Track progress
  const progress = Math.min(100, Math.round((i + chunk.length) * 100 / data.length));
  console.log(`Upload progress: ${progress}%`);
}
```

### [](https://jazz.tools/docs/react/using-covalues/filestreams#completing-the-upload)Completing the Upload

Once all chunks are pushed, mark the `FileStream` as complete:

```
// Finalize the upload
fileStream.end();

console.log('Upload complete!');
```

## [](https://jazz.tools/docs/react/using-covalues/filestreams#subscribing-to-filestreams)Subscribing to `FileStream`s

Like other CoValues, you can subscribe to `FileStream`s to get notified of changes as they happen. This is especially useful for tracking upload progress when someone else is uploading a file.

### [](https://jazz.tools/docs/react/using-covalues/filestreams#loading-by-id)Loading by ID

Load a `FileStream` when you have its ID:

```
// Load a FileStream by ID
const fileStream = await FileStream.load(fileStreamId);

if (fileStream) {
  console.log('FileStream loaded successfully');

  // Check if it's complete
  if (fileStream.isBinaryStreamEnded()) {
    // Process the completed file
    const blob = fileStream.toBlob();
  }
}
```

### [](https://jazz.tools/docs/react/using-covalues/filestreams#subscribing-to-changes)Subscribing to Changes

Subscribe to a `FileStream` to be notified when chunks are added or when the upload is complete:

```
// Subscribe to a FileStream by ID
const unsubscribe = FileStream.subscribe(fileStreamId, (fileStream: FileStream) => {
  // Called whenever the FileStream changes
  console.log('FileStream updated');

  // Get current status
  const chunks = fileStream.getChunks({ allowUnfinished: true });
  if (chunks) {
    const uploadedBytes = chunks.chunks.reduce((sum: number, chunk: Uint8Array) => sum + chunk.length, 0);
    const totalBytes = chunks.totalSizeBytes || 1;
    const progress = Math.min(100, Math.round(uploadedBytes * 100 / totalBytes));

    console.log(`Upload progress: ${progress}%`);

    if (fileStream.isBinaryStreamEnded()) {
      console.log('Upload complete!');
      // Now safe to use the file
      const blob = fileStream.toBlob();

      // Clean up the subscription if we're done
      unsubscribe();
    }
  }
});
```

### [](https://jazz.tools/docs/react/using-covalues/filestreams#waiting-for-upload-completion)Waiting for Upload Completion

If you need to wait for a `FileStream` to be fully synchronized across devices:

```
// Wait for the FileStream to be fully synced
await fileStream.waitForSync({
  timeout: 5000  // Optional timeout in ms
});

console.log('FileStream is now synced to all connected devices');
```

This is useful when you need to ensure that a file is available to other users before proceeding with an operation.
