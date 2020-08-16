"use strict"

import Utils from ".././actions/Utils.js";
import Song from "../views/components/Song.js";

// Выполняется только в первый раз
// * mode - текущий режим окна create/update (возможно появятся ещё варианты)
// * imageSrc - уже трансформированная ссылка на ресурс если она есть
// * selectedSong - выбраная запись если она есть
function ModalPageControler(mode, imageSrc, selectedSong)
{
    // Переменные для управления модальным окном (устанавливаются только при первом запуске)
    let modalPage = document.getElementById("modal-page");
    let modalImage = document.getElementById("modal_song_img");
    let modalUpdateButton = document.getElementById("modal-update-button");
    let modalCancelButton = document.getElementById("modal-cancel-button");
    let modalSongLabel = document.getElementById("modal-song-label");
    let modalSongText = document.getElementById("modal-song-text");

    let modalNameInput = document.getElementById("modal-name");
    let modalAutorInput = document.getElementById("modal-autor");
    let modalSongPatchInput = document.getElementById("modal-song-patch");
    let modalImagePatchInput = document.getElementById("modal-img-field");
    let modalStatusInput = document.getElementById("modal-status");


    // Обновляемые переменные (устанавливаются при каждом обращении к функции)
    let user = undefined;
    let imageFile = undefined;
    let songFile = undefined;
    let resultSong = undefined;

    // Выход с модального окна
    modalCancelButton.addEventListener("click", event =>
    {
        modalPage.classList.remove("active");
    });

    // Отключение стандартного поведения для события
    modalPage.addEventListener("dragenter", event =>
    {
        event.stopPropagation();
        event.preventDefault();
    });

    // Отключение стандартного поведения для события
    modalPage.addEventListener("dragover", event =>
    {
        event.stopPropagation();
        event.preventDefault();
    });

    // Реакция на перетаскивание файла
    modalPage.addEventListener("drop", event =>
    {
        if (mode == "create")
        {
            event.stopPropagation();
            event.preventDefault();
        
            let data = event.dataTransfer;
            songFile = data.files[0];
            modalSongText.textContent = data.files[0].name;
        }
    });

    // Получение файла картинки при изменении пути
    modalImagePatchInput.addEventListener("change", event =>
    {
        if (event.target.files[0] !== undefined)
        {
            imageFile = event.target.files[0];
            modalImage.file = event.target.files[0];
            var reader = new FileReader();
            reader.onload = (
                function(aImg) 
                { 
                    return function(e) 
                    {
                        aImg.src = e.target.result;
                    };
                })(modalImage);
            reader.readAsDataURL(event.target.files[0]);
        }
    });

    // Получение файла песни при изменении пути
    modalSongPatchInput.addEventListener("change", event =>
    {
        if (event.target.files[0] !== undefined)
        {
            songFile = event.target.files[0];
            modalSongText.textContent = songFile.name;
        }
    });

    // Применить изменеия
    modalUpdateButton.addEventListener("click", event =>
    {
        if (mode == "create")
        {
            resultSong = createSong();
        }
        else if (mode == "update")
        {
            resultSong = updateSong();
        }

        modalPage.classList.remove("active");
    });

    function updateSong()
    {
        if (selectedSong === undefined || selectedSong === null)
        {
            alert("Song not selected!");
            return;
        }

        let nameValue = modalNameInput.value.trim();
        let autorValue = modalAutorInput.value.trim();
        let createTime = Utils.timeLabelCreater();

        let dbImageName = undefined;
        if (modalImage.src !== imageSrc && imageFile !== undefined)
        {
            dbImageName = "images/" + user.uid + "time" + createTime + imageFile.name;
            firebase.storage().ref(dbImageName)
            .put(imageFile).then(snapshot =>
            {
                console.log("image-load");
            });
        }

        let result = new Song(
            modalStatusInput.checked,
            (nameValue === undefined || nameValue === null || nameValue === "") ? selectedSong.trackName : nameValue,
            (autorValue === undefined || autorValue === null || autorValue === "") ? selectedSong.autor : autorValue,
            selectedSong.trackPatch,
            (dbImageName === undefined) ? selectedSong.imagePatch : "gs://itirod-9196a.appspot.com/" + dbImageName,
            selectedSong.dbId);

        firebase.firestore().collection("songs").doc(selectedSong.dbId).update
        ({
            imagePatch: result.imagePatch,
            songAutor: result.autor,
            songName: result.trackName,
            status: result.status
        })
        .then(function()
        {
            console.log("Document successfully updated!");
        })
        .catch(function(error)
        {
            alert("Failed to update song: ", error);
        });

        if (window.userPlaylist !== undefined && window.userPlaylist !== null)
        {
            for (let len = window.userPlaylist.length; len == 0; len--)
            {
                let pos = window.userPlaylist.findIndex(item => item.dbId === result.dbId);
                if (pos == -1)
                {
                    break;
                }
                window.userPlaylist[pos] = result;
            }
        }

        if (window.currentPlaylist !== undefined && window.currentPlaylist !== null)
        {
            for (let len = window.currentPlaylist.length; len > 0; len--)
            {
                let pos = window.currentPlaylist.findIndex(item => item.dbId == result.dbId);
                if (pos == -1)
                {
                    break;
                }
                window.currentPlaylist[pos] = result;
            }
        }

        return result;
    }

    function createSong()
    {
        let nameValue = modalNameInput.value.trim();
        let autorValue = modalAutorInput.value.trim();
        let createTime = Utils.timeLabelCreater();

        if (nameValue === undefined || nameValue === null || nameValue === "")
        {
            alert("Need to add a name!");
            return;
        }

        if (songFile === undefined)
        {
            alert("Song not added!");
            return;
        }

        let dbSongName = "songs/" + user.uid + "time" + createTime + songFile.name;
        firebase.storage().ref(dbSongName).put(songFile).then(snapshot =>
        {
            console.log("song-load");
        });

        let dbImageName = undefined;
        if (modalImage.src !== imageSrc && imageFile !== undefined)
        {
            dbImageName = "images/" + user.uid + "time" + createTime + imageFile.name;
            firebase.storage().ref(dbImageName)
            .put(imageFile).then(snapshot =>
            {
                console.log("image-load");
            });
        }

        let dbSongId = user.uid + "time" + createTime;
        let result = new Song(
            modalStatusInput.checked,
            nameValue,
            autorValue,
            "gs://itirod-9196a.appspot.com/" + dbSongName,
            (dbImageName === undefined) ? null : "gs://itirod-9196a.appspot.com/" + dbImageName,
            dbSongId);

        firebase.firestore().collection("songs").doc(dbSongId).set
        ({
            imagePatch: result.imagePatch,
            songAutor: autorValue,
            songName: nameValue,
            songPatch: result.trackPatch,
            status: result.status
        })
        .then(data =>
        {
            console.log("Document successfully written!");
        }).catch(error => {alert("Error writing document: " + error);});

        firebase.firestore().collection("users").doc(user.uid).collection("music").add
        ({
            patch: "/songs/" + dbSongId
        }).then(doc =>{}).catch(error => {});

        if (window.userPlaylist !== undefined && window.userPlaylist !== null && window.currentTrackPosition !== undefined)
        {
            window.currentTrackPosition++;
            window.userPlaylist.unshift(result);
        }
        else
        {
            window.currentTrackPosition = 0;
            window.userPlaylist[result];
        }

        return result;
    }

    // Выполняется при каждом открытии модального окна (перезаписывает текущую)
    // * mode - текущий режим окна create/update (возможно появятся ещё варианты)
    // * imageSrc - уже трансформированная ссылка на ресурс если она есть
    // * selectedSong - выбраная запись если она есть
    function ModalPageControler (localMode, imageSrc, localSelectedSong)
    {
        user = firebase.auth().currentUser;
        mode = localMode;
        selectedSong = localSelectedSong;
        resultSong = undefined;
        imageFile = undefined;
        songFile = undefined;
        modalStatusInput.checked = false;
        modalImage.src = (imageSrc === undefined || imageFile === null) ? window.baseImage : imageSrc;
        modalSongText.textContent = "Select file (can drop)";

        if (selectedSong !== undefined)
        {
            if (String(selectedSong.dbId).indexOf(user.uid) !== 0 && mode == "update")
            {
                alert("You cannot change the post created by another user!");
                return;
            }

            modalNameInput.value = (selectedSong.trackName !== undefined && selectedSong.trackName !== null) ? selectedSong.trackName : "";
            modalAutorInput.value = (selectedSong.autor !== undefined && selectedSong.autor !== null) ? selectedSong.autor : "";
            modalStatusInput.checked = selectedSong.status;
        }
        else
        {
            modalNameInput.value = "";
            modalAutorInput.value = "";
            modalStatusInput.checked = false;
        }

        // В зависимости от режима отображает поле для добавления песни (возможно стоит удалить и сделать проверку selectedSong === undefined)
        if (mode == "create")
        {
            modalSongLabel.classList.remove("active");
            modalSongLabel.classList.add("active");
        }
        else if (mode == "update")
        {
            modalSongLabel.classList.remove("active");
        }

        modalPage.classList.add("active");

        return resultSong;
    }

    return ModalPageControler(mode, imageSrc, selectedSong);
}

export default ModalPageControler;