require 'xcodeproj'
require_relative '../node_modules/react-native/scripts/cocoapods/helpers'

minimum = Gem::Version.new(Helpers::Constants.min_ios_version_supported)
projects = %w[ReactNativeDesignExample.xcodeproj Pods/Pods.xcodeproj]
violations = projects.flat_map do |path|
  Xcodeproj::Project.open(File.join(__dir__, path)).native_targets.flat_map do |target|
    target.resolved_build_setting('IPHONEOS_DEPLOYMENT_TARGET', true).map do |config, version|
      "#{target.name}/#{config}=#{version || 'unset'}" if !version || Gem::Version.new(version) < minimum
    end.compact
  end
end

abort "Targets below RN iOS #{minimum}: #{violations.join(', ')}" unless violations.empty?
puts "App and Pods targets meet RN iOS #{minimum}."
