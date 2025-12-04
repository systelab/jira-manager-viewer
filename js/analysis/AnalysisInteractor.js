(function(interactors)
{
    function AnalysisInteractor()
    {
        
    }

    Object.defineProperties(AnalysisInteractor.prototype,
    {
        getIssue : {
            value: function(key, listener)
            {
                var base = credentials.server + "/rest/api/3/issue/";
                var query = key + "?fields=subtasks";
                var url = base + query;

				$.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: url,
                    beforeSend: function(xhr) { 
						xhr.setRequestHeader("Authorization", "Basic " + credentials.token);
                        $.xhrPool.push(xhr);
					},
					success: function (json)
					{
						listener.onSuccess(json);
					},
					error: function (jqxhr, textStatus, error)
					{
                        if(textStatus != "abort")
                        {
                            listener.onError(jqxhr.responseJSON);
                        }
					}
				});
            },
            enumerable: false
        },
        getIssues : {
            value: function(issues, listener, nextPageToken = null, accumulated = [])
            {
                var self = this;

                var base = credentials.server + "/rest/api/3/search/jql?";
                var query = "jql=parent in (" + issues.toString() + ")+order+by+updated";
                var options = "&fields=assignee,status,parent,summary,issuetype,worklog,timetracking&expand=changelog";
                var url = base + query + options;
                
                if (nextPageToken)
                {
                    url += "&nextPageToken=" + nextPageToken;
                }

                $.ajax({
                    type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
                    url: url,
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader("Authorization", "Basic " + credentials.token);
                        $.xhrPool.push(xhr);
                    },
                    success: function (json)
                    {
                        accumulated = accumulated.concat(json.issues);

                        if (!json.isLast && json.nextPageToken) 
                        {
                            self.getIssues(issues, listener, json.nextPageToken, accumulated);
                        }
                        else
                        {
                            json.issues = accumulated;
                            listener.onSuccess(json);
                        }
                    },
                    error: function (jqxhr, textStatus)
                    {
                        if (textStatus !== "abort") {
                            listener.onError(jqxhr.responseJSON);
                        }
                    }
                });
            },
            enumerable: false
        }
    });

    interactors.AnalysisInteractor = AnalysisInteractor;
})(viewer.interactors);