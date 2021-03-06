!function( window, Contemplate, marked, hljs, CodeMirror ) {
    "use strict";
    
    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL,
        saveAs = window.saveAs || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs,
        saveBlob = navigator.saveBlob || navigator.msSaveBlob || navigator.mozSaveBlob || navigator.webkitSaveBlob,
        
        editor, currentURL = document.location.href,
        equation_re = /<equation>((.*?\n)*?.*?)<\/equation>/ig,
        
        // Because highlight.js is a bit awkward at times
        languageOverrides = {
            js: 'javascript',
            html: 'xml'
        },
        
        wrapper, saveFile, toggleEditor
    ;
    
    marked.setOptions({
        baseURI: currentURL.split('/').slice(0,-1).join('/'),
        
        highlight: function( code, lang ) {
            if ( languageOverrides[lang] ) lang = languageOverrides[lang];
            return hljs.LANGUAGES[lang] ? hljs.highlight(lang, code).value : code;
        }
    });

    saveFile = function( doc, code ) {
        var blob = new Blob(["\ufeff" /* utf8 bytes*/, code], { type: 'text/plain' }),
            name = "untitled.md"
        ;
        if ( saveAs )
        {
            saveAs( blob, name );
        }
        else if ( saveBlob )
        {
            saveBlob( blob, name );
        } 
        else
        {
            var url = URL.createObjectURL( blob );
            var link = doc.createElement("a");
            var event = doc.createEvent('MouseEvents');
            link.setAttribute("href", url);
            link.setAttribute("download", name);
            event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
            link.dispatchEvent( event );
        }
    };
    
    toggleEditor = function( editor, show ) {
        if ( true === show )
        {
            editor.is_hidden = false;
            wrapper.className = 'wrapper';
        }
        else
        {
            editor.is_hidden = true;
            wrapper.className = 'wrapper view';
        }
    };
    
    window.addEventListener("message", function renderContent( event ) {
        //if ( "chrome://mark-I" !== event.origin  ) return;
        if ( !event.data || "render" !== event.data.message  ) return;
        window.removeEventListener("message", renderContent );
        
        Contemplate.add({'viewer': [event.data.tpl]});
        document.body.innerHTML = Contemplate.tpl('viewer', {});
        
        wrapper = document.getElementsByClassName('wrapper')[0];
        
        editor = CodeMirror.fromTextArea(document.getElementById('code'), {
            mode: 'gfm',
            lineNumbers: true,
            matchBrackets: true,
            lineWrapping: true,
            theme: 'default',
            onChange: function ( e ) {
                var markdownHTML = marked( 
                    e.getValue( )
                    .replace(equation_re, function(a, b){
                        return '<img src="http://latex.codecogs.com/png.latex?' + encodeURIComponent(b) + '" />';
                    }) 
                );
                document.getElementById('out').innerHTML = markdownHTML;
            }
        });
        editor.is_hidden = false;
        
        document.getElementById('btn-toggle').addEventListener('mouseup', function(){
            toggleEditor( editor, editor.is_hidden );
            return false;
        }, false);
        
        document.getElementById('btn-save').addEventListener('mouseup', function(){
            saveFile( document, editor.getValue( ) );
            return false;
        }, false);
        
        document.addEventListener('keydown', function(e){
            if ( e.ctrlKey || e.metaKey )
            {
                if ( 83 === e.keyCode ) // CTRL+S, save document
                {
                    e.preventDefault( );
                    saveFile( document, editor.getValue( ) );
                    return false;
                }
                else if ( 84 === e.keyCode ) // CTRL+T, toggle editor
                {
                    e.preventDefault( );
                    toggleEditor( editor, editor.is_hidden );
                    return false;
                }
            }
        });
        
        editor.setValue( event.data.data );
        toggleEditor( editor, false );
    }, false);
    
}(window, Contemplate, marked, hljs, CodeMirror);