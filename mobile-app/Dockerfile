FROM node:18-bullseye

WORKDIR /opt

RUN apt update && \
    apt upgrade -y && \
    apt install -y wget unzip openjdk-17-jdk

RUN wget https://services.gradle.org/distributions/gradle-8.10.2-bin.zip -P /opt && \
    unzip /opt/gradle-8.10.2-bin.zip -d gradle && \
    export PATH=$PATH:/opt/gradle/gradle-8.10.2/bin

RUN wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O /opt/tools.zip && \
    unzip /opt/tools.zip && \
    mkdir android-sdk/ && \
    mkdir android-sdk/cmdline-tools/ && \
    mkdir android-sdk/cmdline-tools/latest && \
    cp -r cmdline-tools/* android-sdk/cmdline-tools/latest/ && \
    rm *.zip

RUN export ANDROID_HOME=/opt/android-sdk && \
    export ANDROID_SDK_ROOT=/opt/android-sdk && \
    export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH && \
    yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

RUN echo "export ANDROID_HOME=/opt/android-sdk" >> ~/.bashrc && \
    echo "export ANDROID_SDK_ROOT=/opt/android-sdk" >> ~/.bashrc && \
    echo "export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH" >> ~/.bashrc && \
    echo "export PATH=$PATH:/opt/gradle/gradle-8.10.2/bin" >> ~/.bashrc

RUN npm install -g cordova && \
    cordova create mobile-app && \
    cd mobile-app/ && \
    cordova platform add android

COPY ./entrypoint.sh /opt/entrypoint.sh

ENTRYPOINT ["bash", "-c", "bash /opt/entrypoint.sh"]