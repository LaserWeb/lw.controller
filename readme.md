## SVG File Organization

Note: This format relies on an Inkscape-defined attribute; other SVG editors not recommended.

Option 1: external CSS and script
```
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<?xml-stylesheet type="text/css" href="filename.css" ?>
<svg
    ...
    xmlns:xlink="http://www.w3.org/1999/xlink"
    >

    ... SVG content ...

    <script xlink:href="svg-script.js" id="script688"></script>
</svg>
```

Option 2: embeded CSS and script
```
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg ...>
    <style
        id="style4"
        type="text/css"><![CDATA[
            ... CSS rules ...
    ]]></style>

    ... SVG content ...

    <script
        id="script688"><![CDATA[
            ... javascript ...
    ]]></script>
</svg>
```

* You create the style sheet. It modifies appearance based on class changes (e.g. button press, indicator true/false change, etc.)
* The script communicates with the controller and adds/removes styles based on the rules in inkscape:label.
* You probably don't need to modify the script when creating custom screens.
* The script tag must be after all content. If Inkscape places content after the script tag, then you must move the tag. Easy way to prevent this: use layers. Once a layer exists, Inkscape won't move it.

## inkscape:label property

JSON object with the following members:

<table>
    <tr>
        <th>Name
        <th>Example
        <th>CSS Classes
        <th>Description
    <tr>
        <td>classes
        <td>{"classes":["a","b"]}
        <td>*
        <td>Add classes to element.
    <tr>
        <td>remove-styles
        <td>{"remove-styles":["fill","stroke"]}
        <td>
        <td>Remove styles from element. This allows CSS rules to control them.
    <tr>
        <td>indicator
        <td>{"indicator":"alarm"}
        <td>true or false
        <td>If(value===true) add "true" CSS class.<br/>If(value===false) add "false" CSS class.
    <tr>
        <td>
        <td>{"indicator":"mposX"}
        <td>
        <td>Replace &lt;text&gt's &lt;tspan&gt;'s content with value.
    <tr>
        <td>type:button
        <td>{"type":"button"}
        <td>type-button
        <td>Installs event handlers for button behavior
    <tr>
        <td>type:field
        <td>{"type":"field"}
        <td>type-field
        <td>Creates a field on top of element
    <tr>
        <td>font
        <td>{"font":"bold 10mm sans"}
        <td>
        <td>Font on field
    <tr>
        <td>action
        <td>{"action":"jog-configured-distance"}
        <td>action-*
        <td>See button desciptions
    <tr>
        <td>axis
        <td>{"axis":"x"}
        <td>axis-*
        <td>See button desciptions
    <tr>
        <td>index
        <td>{"index":"2"}
        <td>index-*
        <td>See button desciptions
    <tr>
        <td>negative
        <td>{"negative":"false"}
        <td>negative-*
        <td>See button desciptions
</table>

## Indicators

## Fields

## Buttons
