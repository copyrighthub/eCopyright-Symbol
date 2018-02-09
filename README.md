# eCopyright-Symbol

Add the eCopyright Symbol to images in you pages by including this in the <head> of your page

```
<script src="//code.jquery.com/jquery-1.9.1.min.js"></script>
<script src="//gateway.copyrighthub.org/copyright-hub-ecopyright.js"></script>
```

Images with hubkeys in their IPTC/EXIF data will be automatically recognised.

Alternatively add attributes to your image's HTML as follows :
* data-hubpid="{your provider name}"
* data-hubidt="{your source type}"
* data-hubaid="{your asset id}"

eg
```
<img src="ouimage.jpg" data-hubpid="thedailytelegraph" data-hubaid="telcopy001" data-hubidt="telegraph_id">
```
