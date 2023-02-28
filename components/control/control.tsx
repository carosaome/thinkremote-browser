import { Fullscreen  } from "@mui/icons-material";
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import MouseOutlinedIcon from '@mui/icons-material/MouseOutlined';
import VideoSettingsOutlinedIcon from '@mui/icons-material/VideoSettingsOutlined';
import { List, SpeedDial, SpeedDialAction } from "@mui/material";
import React, { useEffect, useState } from "react"; // we need this to make JSX compile
import { WebRTCClient } from "webrtc-streaming-core";
import { getOS , Platform} from "webrtc-streaming-core/dist/utils/platform";
import { AskSelectBitrate } from "../popup/popup";
import { VirtualGamepad } from "../virtGamepad/virtGamepad";
import { VirtualMouse } from "../virtMouse/virtMouse";


export type ButtonMode = "static" | "draggable" | "disable";

export const WebRTCControl = (input: { 
	    GamepadACallback: (x: number, y: number,type: 'left' | 'right') => Promise<void>,
	    GamepadBCallback: (index: number,type: 'up' | 'down') => Promise<void>,
        MouseMoveCallback: (x: number, y: number) => Promise<void>,
        MouseButtonCallback: (index: number,type: 'up' | 'down' ) => Promise<void>,

        bitrate_callback: (bitrate: number) => void, 
        toggle_mouse_touch_callback: (enable: boolean) => void, 
        platform: Platform}) => {
    const [enableVGamepad, setenableVGamepad] = useState<ButtonMode>("disable");
    const [enableVMouse, setenableVMouse] = useState<ButtonMode>("disable");
    const [actions,setactions] = useState<any[]>([]);

    useEffect(()  => {
        console.log(`configuring menu on ${input.platform}`)
        if (input.platform == 'mobile') {
            setactions([{
                icon: <VideoSettingsOutlinedIcon />,
                name: "Bitrate",
                action: async () => { 
                    let bitrate = await AskSelectBitrate();
                    if (bitrate < 500) {
                        return;
                    }
                    console.log(`bitrate is change to ${bitrate}`);
                    input.bitrate_callback(bitrate);
                },
            },
            {
                icon: <SportsEsportsOutlinedIcon />,
                name: "Edit VGamepad",
                action: async () => {
                    setenableVGamepad((prev) => { 
                        switch (prev) {
                            case "disable":
                                input.toggle_mouse_touch_callback(false);
                                return "draggable";
                            case "draggable":
                                return "static";
                            case "static":
                                input.toggle_mouse_touch_callback(true);
                                return "disable";
                        } });
                },
            }, {
                icon: <MouseOutlinedIcon />,
                name: "Enable VMouse",
                action: async () => {
                    setenableVMouse((prev) => { 
                        switch (prev) {
                            case "disable":
                                input.toggle_mouse_touch_callback(false);
                                return "draggable";
                            case "draggable":
                                return "static";
                            case "static":
                                input.toggle_mouse_touch_callback(true);
                                return "disable";
                            }
                    });
                },
            } ])
        } else {
            setactions([{
                icon: <VideoSettingsOutlinedIcon />,
                name: "Bitrate",
                action: async () => { try {
                    let bitrate = await AskSelectBitrate();
                    if (bitrate < 500) {
                        return;
                    }
                    console.log(`bitrate is change to ${bitrate}`);
                    input.bitrate_callback(bitrate);
                } catch {}},
            },
            {
                icon: <Fullscreen />,
                name: "Enter fullscreen",
                action: async () => {
                    document.documentElement.requestFullscreen();
                },
            }])
        }
    },[input.platform])

    











    let filter = 0;
	const MouseJTcallback = async (x: number, y: number) => { // translate cordinate
        if (filter == 30) {
            input.MouseMoveCallback(x*10,y*10);
            filter = 0;
        }
        filter++;
	}



    return (
        <div>
            <div style={{ zIndex: 2 }}>
                <SpeedDial
                    ariaLabel="SpeedDial basic example"
                    sx={{
                        opacity: 0.3,
                        position: "absolute",
                        bottom: 16,
                        right: 16,
                    }}
                    icon={<List />}
                >
                    {actions.map((action) => (
                        <SpeedDialAction
                            key={action.name}
                            icon={action.icon}
                            tooltipTitle={action.name}
                            onClick={action.action}
                        />
                    ))}
                </SpeedDial>
            </div>

            <VirtualMouse
                MouseMoveCallback={MouseJTcallback} 
                MouseButtonCallback={input.MouseButtonCallback} 
                draggable={enableVMouse}/>

            <VirtualGamepad 
                ButtonCallback={input.GamepadBCallback} 
                AxisCallback={input.GamepadACallback} 
                draggable={enableVGamepad}/>
        </div>
    );
};
