`ImageDefinition` is a specialized CoValue designed specifically for managing images in Jazz applications. It extends beyond basic file storage by supporting a blurry placeholder, built-in resizing, and progressive loading patterns.

Beyond ImageDefinition, Jazz offers higher-level functions and components that make it easier to use images:

- [`createImage()`](https://jazz.tools/docs/react/using-covalues/imagedef#creating-images) - function to create an `ImageDefinition` from a file
- [`Image`](https://jazz.tools/docs/react/using-covalues/imagedef#displaying-images) - React component to display a stored image

The [Image Upload example](https://github.com/gardencmp/jazz/tree/main/examples/image-upload) demonstrates use of images in Jazz.

## [](https://jazz.tools/docs/react/using-covalues/imagedef#creating-images)Creating Images

The easiest way to create and use images in your Jazz application is with the `createImage()` function:

```
import { createImage } from "jazz-tools/media";

// Create an image from a file input
async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (file) {
    // Creates ImageDefinition with a blurry placeholder, limited to 1024px on the longest side, and multiple resolutions automatically
    const image = await createImage(file, {
      owner: me._owner,
      maxSize: 1024,
      placeholder: "blur",
      progressive: true,
    });

    // Store the image in your application data
    me.profile.image = image;
  }
}
```

**Note:** `createImage()` currently supports browser and react-native environments.

The `createImage()` function:

- Creates an `ImageDefinition` with the right properties
- Generates a small placeholder for immediate display
- Creates multiple resolution variants of your image
- Returns the created `ImageDefinition`

### [](https://jazz.tools/docs/react/using-covalues/imagedef#configuration-options)Configuration Options

```
import type { ImageDefinition, Group, Account } from "jazz-tools";
// ---cut---
declare function createImage(
  image: Blob | File | string,
  options: {
    owner?: Group | Account;
    placeholder?: "blur" | false;
    maxSize?: number;
    progressive?: boolean;
  }): Promise<ImageDefinition>
```

#### [](https://jazz.tools/docs/react/using-covalues/imagedef#image)`image`

The image to create an `ImageDefinition` from. On browser environments, this can be a `Blob` or a `File`. On React Native, this must be a `string` with the file path.

#### [](https://jazz.tools/docs/react/using-covalues/imagedef#owner)`owner`

The owner of the `ImageDefinition`. This is used to control access to the image. See [Groups as permission scopes](https://jazz.tools/docs/react/groups/intro) for more information on how to use groups to control access to images.

#### [](https://jazz.tools/docs/react/using-covalues/imagedef#placeholder)`placeholder`

Sometimes the wanted image is not loaded yet. The placeholder is a base64 encoded image that is displayed while the image is loading. Currently, only `"blur"` is a supported.

#### [](https://jazz.tools/docs/react/using-covalues/imagedef#maxsize)`maxSize`

The image generation process includes a maximum size setting that controls the longest side of the image. A built-in resizing feature is applied based on this setting.

#### [](https://jazz.tools/docs/react/using-covalues/imagedef#progressive)`progressive`

The progressive loading pattern is a technique that allows images to load incrementally, starting with a small version and gradually replacing it with a larger version as it becomes available. This is useful for improving the user experience by showing a placeholder while the image is loading.

Passing `progressive: true` to `createImage()` will create internal smaller versions of the image for future uses.

### [](https://jazz.tools/docs/react/using-covalues/imagedef#create-multiple-resized-copies)Create multiple resized copies

To create multiple resized copies of an original image for better layout control, you can utilize the `createImage` function multiple times with different parameters for each desired size. Here’s an example of how you might implement this:

```
import { co } from "jazz-tools";
import { createImage } from "jazz-tools/media";

// Jazz Schema
const ProductImage = co.map({
  image: co.image(),
  thumbnail: co.image(),
});

const mainImage = await createImage(myBlob);
const thumbnail = await createImage(myBlob, {
  maxSize: 100,
});

// or, in case of migration, you can use the original stored image.
const newThumb = await createImage(mainImage!.original!.toBlob()!, {
  maxSize: 100,
});

const imageSet = ProductImage.create({
  image: mainImage,
  thumbnail,
});
```

## [](https://jazz.tools/docs/react/using-covalues/imagedef#displaying-images)Displaying Images

To use the stored ImageDefinition, there are two ways: the `Image` react component, and the helpers functions.

### [](https://jazz.tools/docs/react/using-covalues/imagedef#image-component)`<Image>` component

The Image component is the best way to let Jazz handle the image loading.

```
import * as React from "react";
import { co } from "jazz-tools";
const ImageDef = co.image();
// ---cut---
import { Image } from "jazz-tools/react";

function GalleryView({ image }: { image: co.loaded<typeof ImageDef> }) {
  return (
    <div className="image-container">
      <Image imageId={image.id} alt="Profile" width={600} />
    </div>
  );
}
```

The `Image` component handles:

- Showing a placeholder while loading, if generated
- Automatically selecting the appropriate resolution, if generated with progressive loading
- Progressive enhancement as higher resolutions become available, if generated with progressive loading
- Determining the correct width/height attributes to avoid layout shifting
- Cleaning up resources when unmounted

The component's props are:

```
export type ImageProps = Omit<
  JSX.IntrinsicElements["img"],
  "src" | "srcSet" | "width" | "height"
> & {
  imageId: string;
  width?: number | "original";
  height?: number | "original";
};
```

#### [](https://jazz.tools/docs/react/using-covalues/imagedef#width-and-height-props)Width and Height props

The `width` and `height` props are used to control the best resolution to use but also the width and height attributes of the image tag.

Let's say we have an image with a width of 1920px and a height of 1080px.

```
<Image imageId="123" />
// <img src={...} /> with the highest resolution available

<Image imageId="123" width="original" height="original" />
// <img width="1920" height="1080" />

<Image imageId="123" width="600" />
// <img width="600" /> leaving the browser to compute the height (might cause layout shift)

<Image imageId="123" width="600" height="original" />
// <img width="600" height="338" /> keeping the aspect ratio

<Image imageId="123" width="original" height="600" />
// <img width="1067" height="600" /> keeping the aspect ratio

<Image imageId="123" width="600" height="600" />
// <img width="600" height="600" />
```

If the image was generated with progressive loading, the `width` and `height` props will determine the best resolution to use.

#### [](https://jazz.tools/docs/react/using-covalues/imagedef#lazy-loading)Lazy loading

The `Image` component supports lazy loading based on [browser's strategy](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#loading). It will generate the blob url for the image when the browser's viewport reaches the image.

```
<Image imageId="123" width="original" height="original" loading="lazy" />
```

### [](https://jazz.tools/docs/react/using-covalues/imagedef#imperative-usage)Imperative usage

Like other CoValues, `ImageDefinition` can be used to load the object.

```
import { ImageDefinition } from "jazz-tools";

const image = await ImageDefinition.load("123", {
  resolve: {
    original: true,
  },
});

if(image) {
  console.log({
    originalSize: image.originalSize,
    placeholderDataUrl: image.placeholderDataURL,
    original: image.original, // this FileStream may be not loaded yet
  });
}
```

`image.original` is a `FileStream` and its content can be read as described in the [FileStream](https://jazz.tools/docs/react/using-covalues/filestreams#reading-from-filestreams) documentation.

Since FileStream objects are also CoValues, they must be loaded before use. To simplify loading, if you want to load the binary data saved as Original, you can use the `loadImage` function.

```
import { loadImage } from "jazz-tools/media";

const image = await loadImage(imageDefinitionOrId);
if(image) {
  console.log({
    width: image.width,
    height: image.height,
    image: image.image,
  });
}
```

If the image was generated with progressive loading, and you want to access the best-fit resolution, use `loadImageBySize`. It will load the image of the best resolution that fits the wanted width and height.

```
import { loadImageBySize } from "jazz-tools/media";

const image = await loadImageBySize(imageDefinitionOrId, 600, 600); // 600x600

if(image) {

  console.log({
    width: image.width,
    height: image.height,
    image: image.image,
  });
}
```

If want to dynamically listen to the _loaded_ resolution that best fits the wanted width and height, you can use the `subscribe` and the `highestResAvailable` function.

```
import { ImageDefinition } from "jazz-tools";
// ---cut---
// function highestResAvailable(image: ImageDefinition, wantedWidth: number, wantedHeight: number): FileStream | null
import { highestResAvailable } from "jazz-tools/media";

const image = await ImageDefinition.load("123");

image?.subscribe({}, (image) => {
  const bestImage = highestResAvailable(image, 600, 600);

  if(bestImage) {
    // bestImage is again a FileStream
    const blob = bestImage.image.toBlob();
    if(blob) {
      const url = URL.createObjectURL(blob);
      // ...
    }
  }
});
```

## [](https://jazz.tools/docs/react/using-covalues/imagedef#image-manipulation-custom-implementation)Image manipulation custom implementation

To manipulate the images (like placeholders, resizing, etc.), `createImage()` uses different implementations depending on the environment. Currently, the image manipulation is supported on browser and react-native environments.

On the browser, the image manipulation is done using the `canvas` API. If you want to use a custom implementation, you can use the `createImageFactory` function in order create your own `createImage` function and use your preferred image manipulation library.

```
import { createImageFactory } from "jazz-tools/media";

const createImage = createImageFactory({
    createFileStreamFromSource: async (source, owner) => {
        // ...
    },
    getImageSize: async (image) => {
        // ...
    },
    getPlaceholderBase64: async (image) => {
        // ...
    },
    resize: async (image, width, height) => {
        // ...
    },
});
```
