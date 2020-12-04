import axios from "axios";
import { h, Component } from "preact";
import ChatFrame from "./chat-frame";
import ChatFloatingButton from "./chat-floating-button";
import ChatTitleMsg from "./chat-title-msg";
import ArrowIcon from "./arrow-icon";
import Api from "./api";
import {
    desktopTitleStyle,
    desktopWrapperStyle,
    mobileOpenWrapperStyle,
    mobileClosedWrapperStyle,
    desktopClosedWrapperStyleChat,
    needHelpMessage
} from "./style";
import { IConfiguration, IMessage } from "../typings";
import Echo from "laravel-echo";

export default class Widget extends Component<any, IWidgetState> {
    Echo: Echo;

    state: IWidgetState;

    constructor() {
        super();
        this.state.isChatOpen = false;
        this.state.pristine = true;
        this.state.wasChatOpened = false;
    }

    componentDidMount() {
        window.botmanChatWidget = new Api(this);

        this.setupEcho();

        if (typeof this.props.conf.init === "function") {
            this.props.conf.init(window.botmanChatWidget);
        }
    }

    private setupEcho() {
        if (this.props.conf.useEcho === true) {
            this.Echo = new Echo(this.props.conf.echoConfiguration);
            // Join channel
            let channel;
            if (this.props.conf.echoChannelType === "private") {
                channel = this.Echo.private(this.props.conf.echoChannel);
            } else {
                channel = this.Echo.channel(this.props.conf.echoChannel);
            }

            channel.listen(
                this.props.conf.echoEventName,
                (message: IMessage) => {
                    window.botmanChatWidget.writeToMessages(message);
                }
            );
        }
    }

    render(props: IWidgetProps, state: IWidgetState) {
        const { conf, isMobile } = props;
        const { isChatOpen, pristine } = state;
        const wrapperWidth = {
            width: isMobile ? conf.mobileWidth : conf.desktopWidth,
        };
        const desktopHeight =
            window.innerHeight - 100 < conf.desktopHeight
                ? window.innerHeight - 90
                : conf.desktopHeight;
        conf.wrapperHeight = desktopHeight;

        let wrapperStyle;

        if (!isChatOpen && (isMobile || conf.alwaysUseFloatingButton)) {
            wrapperStyle = { ...mobileClosedWrapperStyle }; // closed mobile floating button
        } else if (!isMobile) {
            wrapperStyle =
                isChatOpen || this.state.wasChatOpened
                    ? isChatOpen
                        ? { ...desktopWrapperStyle, ...wrapperWidth } // desktop mode, button style
                        : { ...desktopClosedWrapperStyleChat }
                    : { ...desktopClosedWrapperStyleChat }; // desktop mode, chat style
        } else {
            wrapperStyle = mobileOpenWrapperStyle; // open mobile wrapper should have no border
        }

        return (
            <div style={wrapperStyle}>
                {/* Open/close button */}
                {(isMobile || conf.alwaysUseFloatingButton) && !isChatOpen ? (
                    <ChatFloatingButton onClick={this.toggle} conf={conf} />
                ) : isChatOpen || this.state.wasChatOpened ? (
                    isChatOpen ? (
                        <div
                            style={{
                                background: conf.mainColor,
                                ...desktopTitleStyle,
                            }}
                            onClick={this.toggle}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "0px 30px 0px 0px",
                                    fontSize: "1.3rem",
                                    fontWeight: "normal",
                                    color: conf.headerTextColor,
                                }}
                            >
                                <div
                                    style={{
                                        ...needHelpMessage,
                                    }}
                                >
                                    <div>
                                        <svg
                                            width="1em"
                                            height="1em"
                                            viewBox="0 0 16 16"
                                            class="bi bi-question-circle"
                                            fill="currentColor"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
                                            />
                                            <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z" />
                                        </svg>
                                    </div>
                                    <div>OLÁ, PRECISA DE AJUDA?</div>
                                </div>
                            </div>
                            <ArrowIcon isOpened={isChatOpen} />
                        </div>
                    ) : (
                        <ChatTitleMsg onClick={this.toggle} conf={conf} />
                    )
                ) : (
                    <ChatTitleMsg onClick={this.toggle} conf={conf} />
                )}

                {/*Chat IFrame*/}
                <div
                    key="chatframe"
                    style={{
                        display: isChatOpen ? "block" : "none",
                        height: isMobile ? conf.mobileHeight : desktopHeight,
                    }}
                >
                    {pristine ? null : <ChatFrame {...this.props} />}
                </div>
            </div>
        );
    }

    toggle = () => {
        let stateData = {
            pristine: false,
            isChatOpen: !this.state.isChatOpen,
            wasChatOpened: this.state.wasChatOpened,
        };
        if (!this.state.isChatOpen && !this.state.wasChatOpened) {
            if (this.props.conf.sendWidgetOpenedEvent) {
                setTimeout(() => {
                    this.sendOpenEvent();
                }, 500);
            }
            stateData.wasChatOpened = true;
        }
        this.setState(stateData);
    };

    open() {
        this.setState({
            pristine: false,
            isChatOpen: true,
            wasChatOpened: true,
        });
    }

    close() {
        this.setState({
            pristine: false,
            isChatOpen: false,
        });
    }

    private sendOpenEvent() {
        let data = new FormData();
        data.append("driver", "web");
        data.append("eventName", "widgetOpened");
        data.append("eventData", this.props.conf.widgetOpenedEventData);

        axios.post(this.props.conf.chatServer, data).then((response) => {
            const messages = response.data.messages || [];

            messages.forEach((message: IMessage) => {
                window.botmanChatWidget.writeToMessages(message);
            });
        });
    }
}

interface IWidgetState {
    isChatOpen: boolean;
    pristine: boolean;
    wasChatOpened: boolean;
}

interface IWidgetProps {
    iFrameSrc: string;
    conf: IConfiguration;
    isMobile: boolean;
}

declare global {
    interface Window {
        attachEvent: Function;
        botmanChatWidget: Api;
    }
}

// FIXME: toGMTString is deprecated
interface IDate extends Date {
    toUTCString(): string;
}
