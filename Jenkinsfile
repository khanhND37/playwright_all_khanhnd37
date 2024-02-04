pipeline {
    agent {
        kubernetes {
            cloud 'us_test'
            label 'us_test'
            retries 2
        }
    }
    environment {
        BUILD_USER_EMAIL = getEmail()
    }

    options {
        timeout(time: env.BUILD_TIMEOUT_HOURS, unit: 'HOURS')
    }
    triggers {
        GenericTrigger(
            causeString: "Triggered from Webhook",
            token: "tbxsa272xjsjsJPiun28jew2"
        )
    }
    parameters {
        string(name: 'TEST_FILE_OR_FOLDER', defaultValue: './tests', description: 'Testing directory')
        string(name: 'SHARDS', defaultValue: '1', description: 'How many shards should we use?')
        string(name: 'SUITE_ID_OR_CASE_ID', defaultValue: 'TC_SB_DB_LGIN_001', description: 'The Tag, Suite or Case ID that need to run. If empty --> run all tests from TEST_FILE_OR_FOLDER')
        choice(name: 'CI_ENV', choices: ['dev', 'prodtest', 'prod'], description: 'Choose an env to run tests?')
        string(name: 'BRANCH', defaultValue: 'master', description: 'Which code branch to perform tests?')
        string(name: 'TH_JOB_ID', defaultValue: '-1', description: 'Testhub Job ID (If run directly, please skip it)')
        string(name: 'SLACK_ID', defaultValue: '', description: 'Your slack ID to get notification')
        string(name: 'TH_JOB_NAME', defaultValue: '', description: 'Testhub Job Name')
        string(name: 'TH_JOB_RUN_MODE', defaultValue: '', description: 'Testhub Run mode (one-time|multiple-time)')
        string(name: 'TH_JOB_CREATED_BY_EMAIL', defaultValue: '', description: 'Email of people you want to notify')
        string(name: 'PW_PROXY_URL', defaultValue: '', description: 'Proxy URL (burp://, https://, http://, sock5://...)')
        string(name: 'CALLING_CODE', defaultValue: '', description: 'Calling code for receive call if test fail.')
        string(name: 'TH_RUN_GROUP_ID', defaultValue: '-1', description: 'Testhub Run Group ID (If run directly, please skip it)')
    }

    stages {

        stage('Update job desc') {
            steps {
                script {
                    currentBuild.displayName = "${getId()} - ${getUser()}"
                    if (env.TH_JOB_NAME != null && env.TH_JOB_NAME != "") {
                        currentBuild.description = "${TH_JOB_NAME}"
                    }
                }
            }
        }

        stage('Running tests') {
            steps {
                script {
                    container('playwright') {
                        checkout([
                            $class: 'GitSCM',
                            branches: [[name: "${BRANCH}"]],
                            doGenerateSubmoduleConfigurations: false,
                            userRemoteConfigs: [[
                                  url: 'git@gitlab.shopbase.dev:brodev/qa/ocg-autopilot-3.git',
                                  refspec: "+refs/heads/${BRANCH}:refs/remotes/origin/${BRANCH}"
                              ]],
                            extensions: [
                                [$class: 'CloneOption', shallow: true, depth: "${env.MAX_DEPTH}", noTags: true, honorRefspec: true]
                            ]
                        ])


                        sh """
                                yarn install
                        """

                        def originalCaseCode = params.SUITE_ID_OR_CASE_ID
                        def processedCaseCode = appendBoundaryToCaseCode(originalCaseCode)

                        if (processedCaseCode != null && processedCaseCode != "") {
                            sh """
                                set +e
                                OCG_PROXY_URL=${params.PW_PROXY_URL ? params.PW_PROXY_URL : ""} CI_ENV=${CI_ENV} yarn test ${TEST_FILE_OR_FOLDER} -g "${processedCaseCode}" --shard=1/1
                                set -e
                            """
                        } else {
                            sh """
                                set +e
                                OCG_PROXY_URL=${params.PW_PROXY_URL ? params.PW_PROXY_URL : ""} CI_ENV=${CI_ENV} yarn test ${TEST_FILE_OR_FOLDER} --shard=1/1
                                set -e
                            """
                        }
                    }
                }
            }
        }
    }
}

def appendBoundaryToCaseCode(caseCode) {
    if (caseCode == null) {
        return
    }

    if (caseCode.trim().isEmpty()) {
        return ""
    }

    if (caseCode.contains('(') && caseCode.contains(')')) {
        return "$caseCode\\b"
    }

    return "($caseCode)\\b"
}

def getUser() {
    getDesc = currentBuild.getBuildCauses()[0].shortDescription
    userName = getDesc.split('Started by user ')[1]
    if (getEmail() ==~ env.USER_SCHEDULER) {
        userName = "Scheduler"
    }
    return userName
}

def getId() {
    buildId = "#${BUILD_ID}"
    return buildId
}
def getEmail() {
    EMAIL_USER = currentBuild.getBuildCauses()[0].userId
    return EMAIL_USER
}

def agentSelector() {
    def envBuild = "${CI_ENV}"
    def isUserScheduler = (getEmail() ==~ env.USER_SCHEDULER)
    if (isUserScheduler){
        if (envBuild == "prod" || envBuild == "prodtest") {
            return "kubernetes_us"
        } else {
            return "kubernetes_sing"
        }
    } else {
        if (envBuild == "prod" || envBuild == "prodtest") {
            return "kubernetes_qe_us"
        } else {
            return "kubernetes_qe_sing"
        }
    }
}
