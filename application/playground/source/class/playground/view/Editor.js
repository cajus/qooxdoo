/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Container for the source code editor.
 *
 * @asset(playground/*)
 * @asset(playground/editor/lib/*)
 * @asset(playground/editor/mode/*)
 * @asset(playground/editor/addon/*)
 * @asset(playground/editor/addon/*)
 * @ignore(CodeMirror.*, require)
 */
qx.Class.define("playground.view.Editor",
{
  extend : qx.ui.container.Composite,
  include : qx.ui.core.MBlocker,

  statics : {
    loadCodemirror : function(clb, ctx) {
      var resource = [
        "playground/editor/lib/codemirror.js",
        "playground/editor/mode/javascript/javascript.js",
        "playground/editor/addon/edit/matchbrackets.js",
        "playground/editor/addon/hint/jshint.js",
        "playground/editor/addon/lint/lint.js",
        "playground/editor/addon/lint/javascript-lint.js",
        "playground/editor/addon/selection/active-line.js",
        "playground/editor/addon/display/rulers.js",
        "playground/editor/addon/fold/foldcode.js",
        "playground/editor/addon/fold/foldgutter.js",
        "playground/editor/addon/fold/brace-fold.js",
        "playground/editor/addon/fold/xml-fold.js",
        "playground/editor/addon/fold/markdown-fold.js",
        "playground/editor/addon/fold/comment-fold.js"
      ];
      var load = function(list) {
        if (list.length == 0) {
          clb.call(ctx);
          return;
        }
        var res = list.shift();
        var uri = qx.util.ResourceManager.getInstance().toUri(res);
        var loader = new qx.bom.request.Script();
        loader.onload = function() {
          load(list);
        };
        loader.open("GET", uri);
        loader.send();
      }
      load(resource);
    }
  },


  construct : function()
  {
    this.base(arguments);
  },


  events :
  {
    /**
     * Event for signaling that the highlighting could not be done by the editor.
     */
    "disableHighlighting" : "qx.event.type.Event"
  },


  members :
  {
    __textarea : null,
    __highlighted : null,
    __editor : null,
    __codemirror : null,
    __errorLabel : null,

    /**
     * The constructor was spit up to make the included mixin available during
     * the init process.
     */
    init: function()
    {
      this.setBackgroundColor("white");

      // If widgets are added to the container, the zIndex of the editor blocker
      // is set to 100. This makes possible to resize the splitpanes
      this.addListener("addChildWidget", function() {
        this.getBlocker().getBlockerElement().setStyles({ "zIndex" : 100 });
      }, this);

      // layout stuff
      var layout = new qx.ui.layout.VBox();
      this.setLayout(layout);
      this.setDecorator("main");

      // caption
      var dec = new qx.ui.decoration.Decorator().set({
        widthBottom : 1,
        colorBottom : "border-separator"
      });
      var caption = new qx.ui.container.Composite().set({
        padding    : 5,
        allowGrowX : true,
        allowGrowY : true,
        backgroundColor: "white",
        decorator : dec
      });
      this.add(caption);
      // configure caption
      caption.setLayout(new qx.ui.layout.HBox(10));
      caption.add(new qx.ui.basic.Label(this.tr("Source Code")).set({font: "bold"}));
      this.__errorLabel = new qx.ui.basic.Label().set({textColor: "red"});
      caption.add(this.__errorLabel);

      // plain text area
      this.__textarea = new qx.ui.form.TextArea().set({
        wrap      : false,
        font      : qx.bom.Font.fromString("14px monospace"),
        backgroundColor: "white",
        padding   : [0,0,0,5],
        decorator : null
      });
      this.add(this.__textarea, { flex : 1 });

      this.__editor = new qx.ui.core.Widget();
      var highlightDisabled = false;
      var badIE = qx.core.Environment.get("engine.name") == "mshtml";
      if (badIE) {
        badIE = parseFloat(qx.core.Environment.get("browser.version")) <= 8 ||
          qx.core.Environment.get("browser.documentmode") <= 8;
      }

      var opera = qx.core.Environment.get("engine.name") == "opera";

      // FF2 does not have that...
      if (!document.createElement("div").getBoundingClientRect || badIE || opera || !window.CodeMirror) {
        this.fireEvent("disableHighlighting");
        highlightDisabled = true;
      } else {
        this.__editor.addListenerOnce("appear", function() {
          this.__onEditorAppear();
        }, this);
      }
      this.__editor.setVisibility("excluded");
      this.add(this.__editor, { flex : 1 });

      // override the focus border CSS of the editor
      qx.bom.Stylesheet.createElement(
        ".codemirror_editor {border: 0px solid #9F9F9F !important;}"
      );

      // chech the initial highlight state
      var shouldHighligth = qx.bom.Cookie.get("playgroundHighlight") !== "false";
      this.useHighlight(!highlightDisabled && shouldHighligth);
    },


    /**
     * This code part uses the ajax.org code editor library to add a
     * syntax-highlighting editor as an textarea replacement
     *
     * @ignore(CodeMirror.edit, require)
     */
    __onEditorAppear : function() {
      // timout needed for chrome to not get the CodeMirror layout wrong and show the
      // text on top of the gutter
      qx.event.Timer.once(function() {
        var container = this.__editor.getContentElement().getDomElement();

        var ruler = [{color: "#E0E0E0", column: 80, lineStyle: "dashed"}];

        // create the editor
        var editor = this.__codemirror = CodeMirror(function(elt) {
          container.parentNode.replaceChild(elt, container);
        }, {
          theme: "eclipse",
          lineNumbers: true,
          lineWrapping: true,
          matchBrackets: true,
          styleActiveLine: true,
          tabSize: 2,
          mode: "javascript",
          viewportMargin : 100,
          foldGutter: true,
          foldOptions: {
            minFoldSize: 5
          },
          lint: true,
          gutters: ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter"],
          rulers : ruler
        });

        // copy the inital value
        editor.setValue(this.__textarea.getValue() || "");
        
        // Adjust initial size
        var bounds = this.__editor.getBounds();
        editor.setSize(bounds.width, bounds.height);

        var self = this;
        // append resize listener
        this.__editor.addListener("resize", function(ev) {
          // use a timeout to let the layout queue apply its changes to the dom
          window.setTimeout(function() {
            self.__codemirror.setSize("100%", ev.getData().height);
          }, 0);
        });
      }, this, 500);
    },


    /**
     * Returns the current set code of the editor.
     * @return {String} The current set text.
     */
    getCode : function() {
      if (this.__highlighted && this.__codemirror) {
        return this.__codemirror.getValue();
      } else {
        return this.__textarea.getValue();
      }
    },


    /**
     * Sets the given code to the editor.
     * @param code {String} The new code.
     */
    setCode : function(code) {
      if (this.__codemirror) {
        this.__codemirror.setValue(code);

        // move cursor to start to prevent scrolling to the bottom
        this.__codemirror.execCommand("goDocStart");
      }
      this.__textarea.setValue(code);
    },


    /**
     * Displays the given error in the caption bar.
     * @param ex {Exception} The exception to display.
     */
    setError : function(ex) {
      this.__errorLabel.setValue(ex ? ex.toString() : "");
    },


    /**
     * Switches between the ajax code editor editor and a plain textarea.
     * @param value {Boolean} True, if the code editor should be used.
     */
    useHighlight : function(value) {
      this.__highlighted = value;

      if (value) {
        // change the visibility
        this.__editor.setVisibility("visible");
        this.__textarea.setVisibility("excluded");

        // copy the value, if the editor already availabe
        if (this.__codemirror) {
          this.__codemirror.setValue(this.__textarea.getValue());
        }
      } else {
        // change the visibility
        this.__editor.setVisibility("excluded");
        this.__textarea.setVisibility("visible");

        // copy the value, if the editor already availabe
        if (this.__codemirror) {
          this.__textarea.setValue(this.__codemirror.getValue());
        }
      }
    }
  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */

  destruct : function()
  {
    this._disposeObjects("__textarea");
    this.__codemirror = null;
  }
});
