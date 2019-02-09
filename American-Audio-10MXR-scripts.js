////////////////////////////////////////////////////////////////////////
// JSHint configuration                                               //
////////////////////////////////////////////////////////////////////////
/* global engine                                                      */
/* global script                                                      */
/* global print                                                       */
/* global midi                                                        */
//////////////////////////////////////////////////////////////////////// 
/*Written by Steve Hendy(Radioman_00), UK, Aug 2018 for Mixxx 2.1.3 (build 2.1 r6763) Windows 7 64-bit with asio american audio v1.22
Version 1.6 to be used with 10MXR_AUDIO_MIDI_device.midi.xml
Set sound hardware outputs master channels 1-2, Headphones 3-4
Input mappings are set to 3 and 4 in my case but yours maybe another number
Clear hot cues by right clicking mouse on hot cue you want to clear or press shift on mixer and then cue button to clear (in input mappings channel 4)
Track select using rotating knob and navigate with arrow keys
Load btn loads track/syncs and starts play or push rotating knob to just load a track in a stopped deck 
Load led illuminates at start of play and goes out 30 s from end to warn you track is ending and to show you which Load channel is vacant.
slider and knobs are set to softtakeover so move them to get focus
*/
var AA10MXR = new Controller();
var ledState = true;
var shiftState = false;

AA10MXR.init = function() { // called at start
    //  reverse softtakeover to zero so your ears don't get blasted
    engine.setValue("[Channel1]", "volume", 0);
    engine.setValue("[Channel2]", "volume", 0);
    for (j = 0; j <= 200; j += 200) { //sequences lights at start; temp 205 was 25
        for (i = 18; i <= 21; i++) {
            AA10MXR.sequenceleds(i);
        }
        for (i = 12; i <= 13; i++) {
            AA10MXR.sequenceleds(i);
        }
    }
    /* 		modified KANE_QuNeo.js 
    		NOTE: the 2 following controls are called each time the music updates,
            which means ~every 0.02 seconds. Everything that needs consistent updates
            should branch from these functions so we don't eat the cpu.
            Visual playposition is updated roughly 4x more often
            than playposition.
    */
    engine.connectControl("[Channel1]", "playposition", "AA10MXR.playPositionCue");
    engine.connectControl("[Channel2]", "playposition", "AA10MXR.playPositionCue");
};
AA10MXR.sequenceleds = function(i) {
    midi.sendShortMsg(0x90, i, 0x7f); // on LEDs		
    midi.sendShortMsg(0x90, (i + 34), 0x7f); // on LEDs		
    sleep(200 - j);
    midi.sendShortMsg(0x90, i, 0x00); // off LEDs	
    midi.sendShortMsg(0x90, (i + 34), 0x00); // off LEDs	
};

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
};

AA10MXR.loadleds = function(group) {
    print("deck " + group + "led " + ledState);
    if (ledState == true) {
        if (group == "[Channel1]") {
            midi.sendShortMsg(0x90, 101, 0x7f); // Switch-on load A
        } else {
            midi.sendShortMsg(0x90, 102, 0x7f); // Switch-on load B
        }
    } else {
        if (group == "[Channel1]") {
            midi.sendShortMsg(0x80, 101, 0x00); // Switch-off load A Led			
        } else {
            midi.sendShortMsg(0x80, 102, 0x00); // Switch-off load B Led
        }
    }
};

AA10MXR.playPositionCue = function(playposition, group) {
    var secondsBlink = 30;
    if (engine.getValue(group, "play") == 1) {
        //print ("deck " +group);
        var secondsToEnd = engine.getValue(group, "duration") * (1 - playposition);
        if (secondsToEnd > secondsBlink) {
            ledState = true;
        }
        if (secondsToEnd < secondsBlink && secondsToEnd > 1) {
            ledState = false;
        }
        if (secondsToEnd < 1) {
            ledState = false;
            // The song is finished off LEDs
        }
    } else {
        ledState = false;
        // The song stopped off LEDs
    }
    AA10MXR.loadleds(group);
};

AA10MXR.shutdown = function() {
    for (var i = 12; i <= 109; i++) {
        midi.sendShortMsg(0x90, i, 0x00); // kill all LEDs at end
    }
};

// rotary knob coded due to abnormal value   
AA10MXR.myrotaryknob = function(channel, control, value) {
    if (value == 0x3f) {
        engine.setValue("[Playlist]", "SelectNextTrack", 1);
    } else {
        engine.setValue("[Playlist]", "SelectPrevTrack", 1);
    }
};

//sync when load btn pressed, sometimes a longer press is needed
AA10MXR.mysync = function(group) {
    engine.setValue(group, "beatsync", true);
};
