# CNYS
The chat thing where you can set a delay.

Check it out [here](https://cnys.blottn.ie/)

## TODO
- Implement bell
### Bugs

There is a bug where sometimes when a heartbeat fails and the box is deleted it throws an exception

There is also a race condition when someone joins while you are joining. This could be easily fixed by putting the WS setup within the onload but I havent done so yet. 
