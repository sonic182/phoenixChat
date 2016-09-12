defmodule PhoenixChat.Presence do
  use Phoenix.Presence, otp_app: :phoenixChat,
                        pubsub_server: PhoenixChat.PubSub
end
