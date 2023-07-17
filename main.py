import os
import json
import time
import requests
import tkinter
import tkinter.messagebox
import customtkinter
import threading

riotKey = "api_key=RGAPI-a0618cd3-15a9-484a-8934-fae5295e9ec5"


def makeDirs(server):
    Ranks = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"]
    Division = ["IV", "III", "II", "I"]

    for x in Ranks:
        for y in Division:
            path1 = "./rank_data/" + server + "/"
            path2 = "./rank_data/" + server + "/" + x + "/"
            path3 = "./rank_data/" + server + "/" + x + "/" + y + "/"
            if not os.path.exists(path1):
                os.mkdir(path1)
            if not os.path.exists(path2):
                os.mkdir(path2)
            if not os.path.exists(path3):
                os.mkdir(path3)


class App(customtkinter.CTk):
    def __init__(self):
        super().__init__()

        # configure window
        self.title("CustomTkinter complex_example.py")
        self.geometry(f"{1100}x{580}")

        # configure grid layout (4x4)
        self.grid_columnconfigure(1, weight=1)
        self.grid_columnconfigure((2, 3), weight=0)
        self.grid_rowconfigure((0, 1, 2), weight=1)

        self.sidebar_frame = customtkinter.CTkFrame(self, width=140, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, rowspan=4, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(4, weight=1)
        self.logo_label = customtkinter.CTkLabel(
            self.sidebar_frame,
            text="Get ranked data",
            font=customtkinter.CTkFont(size=20, weight="bold"),
        )
        self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 10))

        self.radio_var = tkinter.IntVar(value=0)
        self.radio_button_1 = customtkinter.CTkRadioButton(
            master=self.sidebar_frame, text="EUNE", variable=self.radio_var, value=0
        )
        self.radio_button_1.grid(row=1, column=0, pady=10, padx=20, sticky="n")
        self.radio_button_2 = customtkinter.CTkRadioButton(
            master=self.sidebar_frame, text="EUW", variable=self.radio_var, value=1
        )
        self.radio_button_2.grid(row=2, column=0, pady=10, padx=20, sticky="n")

        self.combobox_var = customtkinter.StringVar(value="option 2")
        self.combobox_1 = customtkinter.CTkOptionMenu(
            master=self.sidebar_frame,
            values=["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"],
        )
        self.combobox_1.grid(row=3, column=0, pady=10, padx=20, sticky="n")
        self.combobox_2 = customtkinter.CTkOptionMenu(
            master=self.sidebar_frame, values=["I", "II", "III", "IV"]
        )
        self.combobox_2.grid(row=4, column=0, pady=10, padx=20, sticky="n")

        self.button = customtkinter.CTkButton(
            master=self.sidebar_frame, text="Start", command=self.start
        )
        self.button.grid(row=5, column=0, pady=10, padx=20, sticky="n")

        self.textbox = customtkinter.CTkTextbox(self, width=250)
        self.textbox.grid(row=0, column=1, padx=(20, 20), pady=(20, 0), sticky="nsew")

        self.logo_label = customtkinter.CTkLabel(
            master=self.textbox, text="Console", text_color="white", font=("Roboto", 24)
        )
        self.logo_label.grid(row=0, column=0, sticky="n")

        customtkinter.set_appearance_mode("Dark")

    def start(self):
        print()
        servers = ["eun1", "euw1"]

        selected_server = servers[self.radio_var.get()]
        rank = self.combobox_1.get()
        division = self.combobox_2.get()
        threading.Thread(
            target=self.getPlayersByRank, args=(selected_server, rank, division)
        ).start()

    def getPlayersByRank(self, server, rank, division):
        allData = []
        dataLength = 205
        page = 1
        self.textbox.insert("0.0", "Page: " + str(page) + "\n")

        while True:
            time.sleep(1.2)

            if dataLength != 205:
                self.textbox.insert("0.0", "Done\n")
                threading.Thread(
                    target=self.getPlayerPuuid, args=(server, rank, division)
                ).start()
                break

            link = (
                "https://"
                + server
                + ".api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/"
                + rank
                + "/"
                + division
                + "?page="
                + str(page)
                + "&"
                + riotKey
            )

            resp = requests.get(link)
            allData.append(resp.json())
            page += 1
            dataLength = len(resp.json())

            with open(
                "./rank_data"
                + "/"
                + server
                + "/"
                + rank
                + "/"
                + division
                + "/"
                + rank
                + "_"
                + division
                + ".json",
                "w",
            ) as outfile:
                json.dump(allData, outfile)
            self.textbox.insert("0.0", "Page: " + str(page) + "\n")

    def getPlayerPuuid(self, server, rank, division):
        path = "./rank_data" + "/" + server + "/" + rank + "/" + division + "/puuids.json"
        if (os.path.exists(path)): 
            with open(
            "./rank_data" + "/" + server + "/" + rank + "/" + division + "/puuids.json",
            "r",
            ) as openfile:
                json_object = json.load(openfile)
        else:
            json_object = []
        
        allData = []
        allPuuids = json_object
        Pages = 0
        Pages2 = 0

        with open(
            "./rank_data"
            + "/"
            + server
            + "/"
            + rank
            + "/"
            + division
            + "/"
            + rank
            + "_"
            + division
            + ".json",
            "r",
        ) as openfile:
            rank_data = json.load(openfile)

        for x in rank_data:
            for y in rank_data[Pages]:
                Pages2 += 1
                allData.append(y["summonerName"])
            Pages += 1

        for n in allData[len(allPuuids) :]:
            time.sleep(1.2)
            name = str(n).replace(" ", "%20")
            link = (
                "https://"
                + server
                + ".api.riotgames.com/lol/summoner/v4/summoners/by-name/"
                + name
                + "?"
                + riotKey
            )
            try:
                resp = requests.get(link)
                puuid = resp.json()["puuid"]
                allPuuids.append(puuid)
            except:
                print("err")
            with open(
                "./rank_data"
                + "/"
                + server
                + "/"
                + rank
                + "/"
                + division
                + "/puuids.json",
                "w",
            ) as outfile:
                json.dump(allPuuids, outfile)
            self.textbox.insert(
                "0.0",
                "Puuids remaining: "
                + str(len(allData) - len(json_object))
                + "\nTime remaining: "
                + str(((len(allData) - len(json_object)) * 1.2) / 60)
                + "minutes\n",
            )


if __name__ == "__main__":
    app = App()
    app.mainloop()
