var viewer = viewer || {};
viewer.helpers = viewer.helpers || {};
viewer.presenters = viewer.presenters || {};
viewer.views = viewer.views || {};
viewer.models = viewer.models || {};
viewer.interactors = viewer.interactors || {};
viewer.listeners = viewer.listeners || {};

(function(helpers)
{
    function Context()
    {
        
    }

    Object.defineProperties(Context.prototype,
    {
        getLoginPresenter : {
            value: function()
            {
                return new viewer.presenters.LoginPresenter(this);
            },
            enumerable: false
        },
        getLoginView : {
            value: function(presenter)
            {
                return new viewer.views.LoginView(presenter);
            },
            enumerable: false
        },
        getLoginInteractor : {
            value: function()
            {
                return new viewer.interactors.LoginInteractor();
            },
            enumerable: false
        },
        getSettingsInteractor : {
            value: function()
            {
                return new viewer.interactors.SettingsInteractor();
            },
            enumerable: false
        },
        getUserStoryPresenter : {
            value: function()
            {
                return new viewer.presenters.UserStoryPresenter(this);
            },
            enumerable: false
        },
        getUserStoryView : {
            value: function(presenter)
            {
                return new viewer.views.UserStoryView(presenter);
            },
            enumerable: false
        },
        getUserStoryInteractor : {
            value: function()
            {
                return new viewer.interactors.UserStoryInteractor();
            },
            enumerable: false
        },
        getBoardPresenter : {
            value: function()
            {
                return new viewer.presenters.BoardPresenter(this);
            },
            enumerable: false
        },
        getBoardView : {
            value: function(presenter)
            {
                return new viewer.views.BoardView(presenter);
            },
            enumerable: false
        },
        getBoardInteractor : {
            value: function()
            {
                return new viewer.interactors.BoardInteractor();
            },
            enumerable: false
        },
        getSetupPresenter : {
            value: function()
            {
                return new viewer.presenters.SetupPresenter(this);
            },
            enumerable: false
        },
        getSetupView : {
            value: function(presenter)
            {
                return new viewer.views.SetupView(presenter);
            },
            enumerable: false
        },
        getSetupInteractor : {
            value: function()
            {
                return new viewer.interactors.SetupInteractor();
            },
            enumerable: false
        },
        getBurndownPresenter : {
            value: function()
            {
                return new viewer.presenters.BurndownPresenter(this);
            },
            enumerable: false
        },
        getBurndownView : {
            value: function(presenter)
            {
                return new viewer.views.BurndownView(presenter);
            },
            enumerable: false
        },
        getBurndownInteractor : {
            value: function()
            {
                return new viewer.interactors.BurndownInteractor();
            },
            enumerable: false
        },
        getPlanningPresenter : {
            value: function()
            {
                return new viewer.presenters.PlanningPresenter(this);
            },
            enumerable: false
        },
        getPlanningView : {
            value: function(presenter)
            {
                return new viewer.views.PlanningView(presenter);
            },
            enumerable: false
        },
        getPlanningInteractor : {
            value: function()
            {
                return new viewer.interactors.PlanningInteractor();
            },
            enumerable: false
        },
        getOffsprintPresenter : {
            value: function()
            {
                return new viewer.presenters.OffsprintPresenter(this);
            },
            enumerable: false
        },
        getOffsprintView : {
            value: function(presenter)
            {
                return new viewer.views.OffsprintView(presenter);
            },
            enumerable: false
        },
        getOffsprintInteractor : {
            value: function()
            {
                return new viewer.interactors.OffsprintInteractor();
            },
            enumerable: false
        },
        getSprintPresenter : {
            value: function()
            {
                return new viewer.presenters.SprintPresenter(this);
            },
            enumerable: false
        },
        getSprintView : {
            value: function(presenter)
            {
                return new viewer.views.SprintView(presenter);
            },
            enumerable: false
        },
        getSprintInteractor : {
            value: function()
            {
                return new viewer.interactors.SprintInteractor();
            },
            enumerable: false
        },
        getWorklogPresenter : {
            value: function()
            {
                return new viewer.presenters.WorklogPresenter(this);
            },
            enumerable: false
        },
        getWorklogView : {
            value: function(presenter)
            {
                return new viewer.views.WorklogView(presenter);
            },
            enumerable: false
        },
        getWorklogInteractor : {
            value: function()
            {
                return new viewer.interactors.WorklogInteractor();
            },
            enumerable: false
        },
        getAnalysisPresenter : {
            value: function()
            {
                return new viewer.presenters.AnalysisPresenter(this);
            },
            enumerable: false
        },
        getAnalysisView : {
            value: function(presenter)
            {
                return new viewer.views.AnalysisView(presenter);
            },
            enumerable: false
        },
        getAnalysisInteractor : {
            value: function()
            {
                return new viewer.interactors.AnalysisInteractor();
            },
            enumerable: false
        },
        getReleaseNotesPresenter : {
            value: function()
            {
                return new viewer.presenters.ReleaseNotesPresenter(this);
            },
            enumerable: false
        },
        getReleaseNotesView : {
            value: function(presenter)
            {
                return new viewer.views.ReleaseNotesView(presenter);
            },
            enumerable: false
        },
        getReleaseNotesInteractor : {
            value: function()
            {
                return new viewer.interactors.ReleaseNotesInteractor();
            },
            enumerable: false
        }
    });

    helpers.Context = Context;
})(viewer.helpers);

(function(helpers)
{
    var list =  {
                    login : "getLoginPresenter",
                    user_story: "getUserStoryPresenter",
                    board: "getBoardPresenter",
                    setup: "getSetupPresenter",
                    burndown: "getBurndownPresenter",
                    planning: "getPlanningPresenter",
                    offsprint: "getOffsprintPresenter",
                    sprint: "getSprintPresenter",
                    worklog: "getWorklogPresenter",
                    analysis: "getAnalysisPresenter",
                    release_notes: "getReleaseNotesPresenter",
                };

    function Initializer()
    {
        var initList = initializeConfig || {};

        var context = new helpers.Context();
        for(var k in initList)
        {
            if(list.hasOwnProperty(initList[k]))
            {
                context[list[initList[k]]]();
            }
        }
    }

    helpers.Initializer = Initializer;
})(viewer.helpers);