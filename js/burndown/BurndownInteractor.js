(function(interactors)
{
    function BurndownInteractor()
    {
        
    }

    Object.defineProperties(BurndownInteractor.prototype,
    {
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
        },
		getAssignableUsers : {
            value: function(issue, listener)
            {
                var self = this;
				$.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/3/user/assignable/search?issueKey=" + issue,
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
		getUserGroups : {
            value: function(userid, listener)
            {
                var self = this;
				$.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/3/user/groups?accountId=" + userid,
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
		load : {
            value: function(board, sprint, listener)
            {
				$.ajax
				({
					type: "GET",
					url: "/data/burndown_" + board + "_" + sprint + ".json",
					dataType: 'json',
                    contentType: 'application/json',
                    beforeSend: function(xhr)
                    {
                        $.xhrPool.push(xhr);
					},
					success: function (json)
					{
						listener.onSuccess(json);
					},
					error: function (jqxhr, textStatus, error)
					{
                        if(jqxhr.status == 404)
                        {
                            listener.onSuccess({});
                        }
                        else
                        {
                            listener.onError(jqxhr);
                        }
					}
				});
            },
            enumerable: false
        },
        save : {
            value: function(board, sprint, data, listener)
            {
				$.ajax
				({
					type: "POST",
					url: "/data/burndown_" + board + "_" + sprint + ".json",
					data: JSON.stringify(data),
					dataType: 'json',
                    contentType: 'application/json',
                    beforeSend: function(xhr)
                    {
                        
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
        }
    });

    interactors.BurndownInteractor = BurndownInteractor;
})(viewer.interactors);