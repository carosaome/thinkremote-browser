import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import {
    AskSelectBitrate,
    AskSelectDisplay,
    AskSelectFramerate,
    AskSelectSoundcard,
    TurnOnAlert,
    TurnOnStatus,
} from "../components/popup/popup";
import { WebRTCClient } from "webrtc-streaming-core/dist/app";
import { useRouter } from "next/router";
import {
    DeviceSelection,
    DeviceSelectionResult,
} from "webrtc-streaming-core/dist/models/devices.model";
import {
    ConnectionEvent,
    Log,
    LogConnectionEvent,
    LogLevel,
} from "webrtc-streaming-core/dist/utils/log";
import { GetServerSideProps } from "next";
import { GoogleAnalytics } from "nextjs-google-analytics";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { ButtonGroup, VirtualGamepad } from "../components/virtGamepad/virtGamepad";
import { WebRTCControl } from "../components/control/control";
import DPad from "../components/gamepad/d_pad";
import YBXA from "../components/gamepad/y_b_x_a";

type Props = { host: string | null };

export const getServerSideProps: GetServerSideProps<Props> = async (
    context
) => ({ props: { host: context.req.headers.host || null } });

const buttons = [
    <Button key="one">One</Button>,
    <Button key="two">Two</Button>,
    <Button key="three">Three</Button>,
];

const Home = ({ host }) => {
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const remoteAudio = useRef<HTMLAudioElement>(null);

    const router = useRouter();
    const { signaling, token, fps, bitrate } = router.query;
    const signalingURL = Buffer.from(
        (signaling
            ? signaling
            : "d3NzOi8vc2VydmljZS50aGlua21heS5uZXQvaGFuZHNoYWtl") as string,
        "base64"
    ).toString();
    const signalingToken = (token ? token : "none") as string;
    var defaultBitrate = parseInt((bitrate ? bitrate : "6000") as string, 10);
    var defaultFramerate = parseInt((fps ? fps : "55") as string, 10);
    var defaultSoundcard = "Default Audio Render Device";
    const selectDevice = async (offer: DeviceSelection) => {
        LogConnectionEvent( ConnectionEvent.WaitingAvailableDeviceSelection);
        let ret = new DeviceSelectionResult(
            offer.soundcards[0].DeviceID,
            offer.monitors[0].MonitorHandle.toString()
        );

        if (offer.soundcards.length > 1) {
            let exist = false;
            if (defaultSoundcard != null) {
                offer.soundcards.forEach((x) => {
                    if (x.Name == defaultSoundcard) {
                        exist = true;
                        ret.SoundcardDeviceID = x.DeviceID;
                        defaultSoundcard = null;
                    }
                });
            }

            if (!exist) {
                ret.SoundcardDeviceID =
                    await AskSelectSoundcard(
                        offer.soundcards
                    );
                Log(
                    LogLevel.Infor,
                    `selected audio deviceid ${ret.SoundcardDeviceID}`
                );
            }
        }

        if (offer.monitors.length > 1) {
            ret.MonitorHandle = await AskSelectDisplay(
                offer.monitors
            );
            Log(
                LogLevel.Infor,
                `selected monitor handle ${ret.MonitorHandle}`
            );
        }

        if (defaultBitrate == null) {
            ret.bitrate = await AskSelectBitrate();
        } else {
            ret.bitrate = defaultBitrate;
        }
        if (defaultFramerate == null) {
            ret.framerate = await AskSelectFramerate();
        } else {
            ret.framerate = defaultFramerate;
        }

        return ret;
    }

    const [client,setClient] = useState<WebRTCClient>(null);
    useEffect(() => {
        setClient(new WebRTCClient( signalingURL, remoteVideo, remoteAudio, signalingToken, selectDevice).Notifier((message) => {
            console.log(message);
            TurnOnStatus(message);
        }).Alert((message) => {
            console.log(message);
            TurnOnAlert(message);
        }));
    }, []);

    return (
        <div>
            <GoogleAnalytics trackPageViews />
            <Head>
                <title>WebRTC remote viewer</title>
                <meta
                    name="description"
                    content="Generated by create next app"
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
                ></meta>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <WebRTCControl client={client}></WebRTCControl>
            <video
                ref={remoteVideo}
                className={styles.remoteVideo}
                autoPlay
                muted
                playsInline
                loop
                style={{ zIndex: -1 }}
            ></video>
            <audio
                ref={remoteAudio}
                autoPlay
                controls
                style={{ zIndex: -5, opacity: 0 }}
            ></audio>
        </div>
    );
};
// const Home = () => {
//   console.log('object');
//   return (
//     <ReactNipple
//       // supports all nipplejs options
//       // see https://github.com/yoannmoinet/nipplejs#options
//       options={{ mode: 'static', position: { top: '50%', left: '50%' } }}
//       // any unknown props will be passed to the container element, e.g. 'title', 'style' etc
//       style={{
//         outline: '1px dashed red',
//         width: 150,
//         height: 150
//         // if you pass position: 'relative', you don't need to import the stylesheet
//       }}
//       // all events supported by nipplejs are available as callbacks
//       // see https://github.com/yoannmoinet/nipplejs#start
//       onMove={(evt, data) => console.log(evt, data)}
//     />
//   );
// };

export default Home;
