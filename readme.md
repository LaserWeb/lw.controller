## SVG File Organization

...

## inkscape:label

JSON object with the following attributes:

<table>
    <tr>
        <th>Name
        <th>On
        <th>Example
        <th>CSS Classes
        <th>Description
    <tr>
        <td>classes
        <td>any
        <td>{"classes":["a","b"]}
        <td>*
        <td>Add classes to element.
    <tr>
        <td>remove-styles
        <td>any
        <td>{"remove-styles":["fill","stroke"]}
        <td>
        <td>Remove styles from element. This allows CSS rules to control them.
    <tr>
        <td>indicator
        <td>any
        <td>{"indicator":"alarm"}
        <td>true or false
        <td>If(value===true) add "true" CSS class.<br/>If(value===false) add "false" CSS class.
    <tr>
        <td>indicator
        <td>&lt;text&gt
        <td>{"indicator":"mposX"}
        <td>
        <td>Replace &lt;text&gt's &lt;tspan&gt;'s content with value.
    <tr>
        <td>type:button
        <td>any
        <td>{"type":"button"}
        <td>type-button
        <td>Installs event handlers for button behavior
    <tr>
        <td>type:field
        <td>any
        <td>{"type":"field"}
        <td>type-field
        <td>Creates a field on top of element
    <tr>
        <td>action
        <td>any
        <td>{"action":"jog-configured-distance"}
        <td>action-*
        <td>See button desciptions
    <tr>
        <td>axis
        <td>any
        <td>{"axis":"x"}
        <td>axis-*
        <td>See button desciptions
    <tr>
        <td>index
        <td>any
        <td>{"index":"2"}
        <td>index-*
        <td>See button desciptions
    <tr>
        <td>negative
        <td>any
        <td>{"negative":"false"}
        <td>negative-*
        <td>See button desciptions
</table>

## Indicators

## Fields

## Buttons
